"""
Preference Tuning Throughput Benchmark
Fixed version with corrected RealDocsStreamToBatchIterator
"""

import torch
from transformers import AutoTokenizer, AutoModelForCausalLM, GPT2TokenizerFast, GenerationConfig
import json
import time
import os


class RealDocsStreamToBatchIterator:
    """Stream text file, split into batches of tokens.
    
    FIXED: 
    - Typo char_postion -> char_position
    - Added expected_batches initialization
    - Fixed stride to be batch_size instead of 512
    - Improved file reading logic
    - Added tokenizer parameter
    """
    def __init__(self, file_path, batch_size, tokenizer=None, encoding_prefix_len=4):
        self.file_handle = open(file_path, 'r', encoding='utf-8', errors='ignore')
        self.batch_size = batch_size
        self.encoding_prefix_len = encoding_prefix_len
        
        # FIXED: Use provided tokenizer or load default
        if tokenizer is not None:
            self.tokenizer = tokenizer
        else:
            self.tokenizer = GPT2TokenizerFast.from_pretrained('gpt2')
            
        self.vocab = self.tokenizer.get_vocab()
        
        # FIXED: Set stride to batch_size to avoid massive overlap
        self.stride = batch_size
        self.total_chars = 0
        self.batches_yielded = 0
        
        # FIXED: Initialize expected_batches
        self.expected_batches = float('inf')
        
        # Binary search for max file size
        self.file_handle.seek(0, 2)
        self.file_size = self.file_handle.tell()
        self.file_handle.seek(0)
        self.index = 0

    def __iter__(self):
        return self

    def __next__(self):
        # FIXED: Proper boundary checking before reading
        seek_position = self.index * self.stride
        
        if seek_position >= self.file_size:
            self.file_handle.close()
            raise StopIteration
            
        if self.batches_yielded >= self.expected_batches:
            self.file_handle.close()
            raise StopIteration
        
        # FIXED: Removed buggy char_postion typo, simplified reading
        self.file_handle.seek(seek_position, 0)
        
        # Read batch_size characters directly
        current_batch = self.file_handle.read(self.batch_size)
        
        if not current_batch:
            self.file_handle.close()
            raise StopIteration
            
        self.total_chars += len(current_batch)
        
        try:
            # Tokenize with prefix handling
            encoding = self.tokenizer.encode(current_batch, add_special_tokens=False)
            
            if len(encoding) < self.encoding_prefix_len:
                # If too short, skip to next batch
                self.index += 1
                return self.__next__()
            
            # Create prefix
            prefix = encoding[:self.encoding_prefix_len]
            prefix_text = self.tokenizer.decode(prefix, skip_special_tokens=True)
            
            # Create suffix
            suffix = encoding[self.encoding_prefix_len:]
            suffix_text = self.tokenizer.decode(suffix, skip_special_tokens=True)
            
            # Prepare batch
            batch_texts = [prefix_text, suffix_text]
            
            # Move file pointer for next batch
            self.index += 1
            self.batches_yielded += 1
            
            return batch_texts
            
        except GeneratorExit:
            self.file_handle.close()
            raise
        except Exception as e:
            # FIXED: Better error handling - skip problematic batch
            print(f"Warning: Tokenization failed for batch at index {self.index}: {e}")
            self.index += 1
            return self.__next__()

    def __del__(self):
        # FIXED: Ensure file is closed on cleanup
        try:
            if hasattr(self, 'file_handle') and self.file_handle:
                self.file_handle.close()
        except:
            pass


class PreferenceTuningBenchmark:
    def __init__(self, model_name="meta-llama/Llama-3.1-405B-Instruct", device="cuda"):
        self.model_name = model_name
        self.device = device
        self.model = None
        self.tokenizer = None
        self.batch_size = 1024 * 256  # 262144 tokens

    def setup_model_and_tokenizer(self):
        """Load model and tokenizer"""
        print(f"Loading {self.model_name} model...")
        
        self.tokenizer = AutoTokenizer.from_pretrained(self.model_name)
        
        # Set pad token if not present
        if self.tokenizer.pad_token is None:
            self.tokenizer.pad_token = self.tokenizer.eos_token
            
        self.model = AutoModelForCausalLM.from_pretrained(
            self.model_name,
            torch_dtype=torch.bfloat16,
            device_map="auto",
            load_in_8bit=True,
        )

    def generate(self, prompt, max_new_tokens=256, temperature=0.7):
        """Generate text from a prompt"""
        inputs = self.tokenizer(
            prompt, 
            return_tensors="pt", 
            truncation=True,
            max_length=self.model.config.max_position_embeddings - max_new_tokens
        ).to(self.device)

        with torch.no_grad():
            output_ids = self.model.generate(
                **inputs,
                max_new_tokens=max_new_tokens,
                temperature=temperature,
                do_sample=True,
                pad_token_id=self.tokenizer.pad_token_id,
                eos_token_id=self.tokenizer.eos_token_id,
            )

        generated_text = self.tokenizer.decode(output_ids[0], skip_special_tokens=True)
        return generated_text[len(prompt):]

    def generate_with_cfg(self, prompt, max_new_tokens=256, temperature=0.7):
        """Generate with CFG"""
        inputs = self.tokenizer(
            prompt,
            return_tensors="pt",
            truncation=True,
            max_length=self.model.config.max_position_embeddings - max_new_tokens
        ).to(self.device)

        generation_config = GenerationConfig(
            max_new_tokens=max_new_tokens,
            temperature=temperature,
            do_sample=True,
            pad_token_id=self.tokenizer.pad_token_id,
            eos_token_id=self.tokenizer.eos_token_id,
        )

        with torch.no_grad():
            output_ids = self.model.generate(**inputs, generation_config=generation_config)

        output_ids = output_ids[:, inputs.input_ids.shape[1]:]
        generated_text = self.tokenizer.decode(output_ids[0], skip_special_tokens=True)
        return generated_text

    def _generate_synthetic_text(self, model, tokenizer, device, prompt, cfg):
        """Generate synthetic text with error handling"""
        if not prompt or len(prompt.strip()) < 10:
            print(f"Warning: Prompt is too short or empty: '{prompt}'")
            return cfg.get('default_response', "Error: Invalid prompt.")

        # 405B specific flag
        is_405b = "405B" in self.model_name

        # Tokenize prompt
        inputs = tokenizer(
            prompt, 
            return_tensors="pt", 
            max_length=1024, 
            truncation=True
        ).to(device)

        if is_405b:
            print(f"DEBUG: [405B] Tokenized length: {inputs.input_ids.shape[1]}, Model max: {model.config.max_position_embeddings}")
            torch.cuda.synchronize()
            for i in range(torch.cuda.device_count()):
                free, total = torch.cuda.mem_get_info(i)
                print(f"DEBUG: [405B] GPU {i} Memory: {free/1e9:.2f}GB free / {total/1e9:.2f}GB total")

        with torch.no_grad():
            try:
                for temp in [cfg.get('temperature', 0.7)]:
                    outputs = model.generate(
                        **inputs,
                        max_length=inputs.input_ids.shape[1] + cfg.get('max_new_tokens', 256),
                        temperature=temp,
                        do_sample=True,
                    )
                    if is_405b:
                        post_mem = torch.cuda.memory_allocated() / 1e9
                        print(f"DEBUG: [405B] Post-generation memory: {post_mem:.2f}GB")
            except Exception as e:
                print(f"Warning: Error during generation: {e}")  
                return cfg.get('default_response', "Error in generation.")

        # FIXED: Handle case where outputs might be empty
        if outputs is None or outputs.numel() == 0:
            return cfg.get('default_response', "Error: Empty model output.")

        generated_text = tokenizer.decode(outputs[0], skip_special_tokens=True)
        return generated_text

    def structured_synthetic_generation(self, generator, num_batches, save_path='generation_output.jsonl'):
        """Generate with structured doc-based prompting"""
        # FIXED: Pass the model's tokenizer instead of letting iterator default to GPT-2
        iterator = RealDocsStreamToBatchIterator(
            '/app/data/c4_sample.txt', 
            generator.batch_size,
            tokenizer=generator.tokenizer  # FIXED: Use matching tokenizer
        )
        
        generated_samples = []
        batch_idx = 0

        for batch_texts in iterator:
            # Tokenize first doc
            encodings = generator.tokenizer(
                batch_texts[0], 
                return_tensors="pt", 
                truncation=True, 
                max_length=1024
            )
            
            selected_text = batch_texts[0]
            prompt = selected_text[:750]
            
            print(f"Processing batch {batch_idx + 1}/{num_batches}")
            print(f"Prompt prefix: {prompt[:100]}...")

            # Generate
            output = generator.generate(prompt, max_new_tokens=256, temperature=0.7)
            
            sample = {
                "prompt": prompt,
                "output": output,
                "batch_index": batch_idx,
                "timestamp": time.time()
            }
            generated_samples.append(sample)

            # Save incrementally
            with open(save_path, 'a', encoding='utf-8') as f:
                f.write(json.dumps(sample, ensure_ascii=False) + '\n')

            batch_idx += 1
            if batch_idx >= num_batches:
                break

        return generated_samples


def main():
    """Main benchmark function"""
    benchmark = PreferenceTuningBenchmark()
    benchmark.setup_model_and_tokenizer()
    
    num_batches = 100
    output_file = 'generation_output.jsonl'
    
    results = benchmark.structured_synthetic_generation(
        benchmark,
        num_batches,
        save_path=output_file
    )
    
    print(f"Generated {len(results)} samples")
    print(f"Output saved to {output_file}")


if __name__ == "__main__":
    main()
