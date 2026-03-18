# Comprehensive Methodology: Extracting Insights on IGF1 Expression from Academic Databases

## Overview
This document outlines a systematic approach to analyze large-scale academic databases to extract meaningful insights about IGF1 expression research - including commonly used assays, cell lines, treatments, and experimental conditions.

---

## Phase 1: Database Strategy & Search Design

### 1.1 Target Database Selection

**Primary Databases:**
- **PubMed / PubMed Central (PMC)** - Primary source for biomedical literature
- **Google Scholar** - Broad coverage for citation analysis
- **Web of Science** - For impact factor and citation metrics
- **Scopus** - For comprehensive document tracking
- **EMBASE** - European pharmacology/regulatory focus

**Supplementary Sources:**
- **DOAJ** (Directory of Open Access Journals)
- **BioRxiv / MedRxiv** - Preprint repositories
- **Thermo Fisher, SCBT, Abcam** - Technical application notes

### 1.2 Search Strategy Construction

**Core Search Strings:**
```
# Primary IGF1 Expression Queries
("IGF1" OR "IGF-I" OR "insulin-like growth factor 1" OR "insulin-like growth factor I") AND ("expression" OR "mRNA" OR "protein")

# Assay-Specific Queries
("IGF1" OR "IGF-I") AND "Western blot"
("IGF1" OR "IGF-I") AND "quantitative PCR" OR "qPCR" OR "RT-qPCR"
("IGF1" OR "IGF-I") AND "immunohistochemistry" OR "IHC"
("IGF1" OR "IGF-I") AND "ELISA"
("IGF1" OR "IGF-I") AND "luciferase" OR "promoter" OR "reporter"

# Cell Line Queries
("IGF1" OR "IGF-I") AND ("MC3T3" OR "MCF7" OR "HepG2" OR "C2C12" OR "H9c2" OR "L6" OR "Human hepatocyte" OR "osteoblast")
```

**Search Syntax Notes:**
- Use boolean operators (AND, OR, NOT)
- Implement truncation with asterisk (*)
- Use quotes for phrase searching
- Filter by date ranges for temporal trends
- Filter by article type (Original Article, Review, etc.)

---

## Phase 2: Information Extraction Framework

### 2.1 Citation Screening Matrix

Create a spreadsheet with these columns:
```
| PMID | Authors | Year | Title | Journal | Impact Factor | PDF Access | Included/Excluded | Reason |
```

### 2.2 Deep Extraction Template

For each included paper, record:

#### Study Metadata
- **Citation:** Full reference
- **DOI:** Direct link [cite:1]
- **Study Type:** In vitro / In vivo / Clinical / Review
- **Tissue/Cell Type:** Primary culture, immortalized line, tissue

#### Assay Information
- **Expression Measurement:**
  - Western blot (antibodies: IGF1, phospho-IGF1R, etc.)
  - qPCR/RT-PCR (primers: IGF1, IGF1R, housekeeping genes)
  - Immunocytochemistry / Immunofluorescence
  - ELISA (sandwich or competitive)
  - Northern blot / RNase protection
  - Reporter assays (luciferase promoter constructs)
  - RNA-seq / microarray (transcriptomics)
  - Flow cytometry (intracellular staining)

#### Biological Sample Details
- **Cell Lines - Common Models:**
  - **MC3T3-E1** (pre-osteoblasts, bone formation models) [cite:2]
  - **MCF-7 / MDA-MB-231** (breast cancer, hormone-responsive)
  - **HepG2 / Huh-7** (hepatocellular carcinoma)
  - **C2C12** (myoblasts, muscle differentiation)
  - **H9c2** (cardiomyocytes)
  - **L6** (skeletal myoblasts)
  - **SaOS-2 / MG-63** (osteosarcoma)
  - **RAW 264.7** (macrophages)
  - **3T3-L1** (pre-adipocytes)
  - **Human primary:** Hepatocytes, osteoblasts, chondrocytes, fibroblasts

- **Primary Cultures:**
  - Rat/mouse hepatocytes
  - Human osteoblasts, chondrocytes
  - Bovine or porcine articular chondrocytes
  - Human dermal fibroblasts

- **Animal Models (In Vivo):**
  - Sprague-Dawley rats (growth studies)
  - C57BL/6 or Balb/c mice (genetic manipulation)
  - GH-deficient models (little mice, hypophysectomized rats)
  - Streptozotocin-induced diabetes models

#### Experimental Conditions & Treatments

**Hormonal Regulators:**
- **Growth Hormone (GH):** Dose-response (0.1-100 ng/mL), time-course
- **Dexamethasone:** Glucocorticoid regulation, anti-inflammatory context
- **Thyroid hormones:** T3/T4 influence on IGF1 synthesis
- **Sex steroids:** Estrogen, testosterone effects
- **Insulin:** Interaction with IGF signaling
- **Progesterone, Cortisol:** Physiological modulation

**Mechanical/Biophysical Stimuli:**
- **Mechanical stretch:** Cyclic deformation protocols
- **Fluid shear stress:** Physiological flow rates
- **Hydrostatic pressure:** Cartilage/chondrocyte studies
- **Vibration:** Low-magnitude mechanical signals

**Pharmacological Agents:**
- **Recombinant IGF1/IGF2:** Exogenous addition
- **GH secretagogues:** Ghrelin analogs, GHRH
- **Dietary factors:** Caloric restriction, high-fat diet, amino acid modulation
- **Phytochemicals:** Genistein, resveratrol, EGCG, curcumin
- **Minerals:** Zinc, magnesium supplementation
- **Anabolic agents:** Anabolic steroids, β-agonists
- **Inhibitors:** IGF1R inhibitors (OSI-906), PI3K inhibitors, MAPK inhibitors

**Pathophysiological Conditions:**
- **Hypoxia:** 1-5% O₂, HIF-1α stabilization effects
- **Inflammation:** TNF-α, IL-1β, IL-6, LPS treatment
- **Oxidative stress:** H₂O₂, paraquat, UV radiation
- **Serum deprivation:** Growth arrest signaling
- **Hyperglycemia:** Diabetes models
- **Uremia:** Kidney disease adaptations

**Genetic Manipulations:**
- **Overexpression:** Lentiviral/adenoviral IGF1 constructs
- **Knockdown:** siRNA, shRNA targeting IGF1 or IGF1R
- **CRISPR/Cas9:** Knockout and base editing
- **Reporter constructs:** IGF1 promoter-luciferase, GFP fusions

### 2.3 Time Course & Dose Response Data
- **Standard Time Points:** 0, 1, 2, 4, 6, 12, 24, 48, 72 hours
- **Dose Ranges:** Physiologic (ng/mL) to pharmacologic (μg/mL)
- **Common Endpoints:** IGF1 protein level, mRNA expression (% control), secretion

---

## Phase 3: Data Analysis & Pattern Recognition

### 3.1 Quantitative Metrics to Calculate

**Publication Landscape:**
- Annual publication count (trend over 10-20 years)
- Journal distribution (subject categories: Endocrinology, Cell Biology, Cancer, Bone, etc.)
- Geographic origin (country of corresponding author)
- Impact factor distribution of publishing journals
- Citation velocity (highly cited papers vs. average)

**Methodological Prevalence:**
- Frequency of each assay type (create bar charts)
- Co-occurrence networks (which assays are used together?)
- Temporal trends (is RNA-seq replacing Northern blots?)
- "Gold standard" combinations (e.g., Western blot + qPCR validation)

**Cell Line Popularity:**
- Ranking of most common cell lines
- Context-specific usage (cancer vs. normal physiology)
- Species distribution (human vs. rodent models)

**Treatment Framework:**
- Most studied modulators (rank by frequency)
- Concentration ranges typically employed
- Most studied pathways/disease contexts

### 3.2 Synthesis & Insight Extraction

**Key Questions to Answer:**
1. What is the "consensus" assay for IGF1 expression measurement?
2. Which cell lines provide the most reproducible results?
3. What are the critical time windows for IGF1 induction?
4. How do different stimuli cluster by mechanism?
5. Are there tissue-specific expression signatures?
6. What are the gaps in current methodology?
7. Which assay combinations provide the most robust validation?

### 3.3 Network Analysis

**Co-occurrence Networks (using VOSviewer or similar):**
- Keyword co-occurrence (
- Author-institution collaboration networks
- Citation networks (highly influential papers)
- Gene/protein interaction networks from extracted data

---

## Phase 4: Reporting & Visualization

### 4.1 Standard Outputs

**Executive Summary:**
- Total papers analyzed
- Publication trend (increasing/decreasing/stable)
- Most common assays identified
- "Key insight" statements (5-7 bullet points)

**Technical Report:**
- Detailed methodology section
- Complete data tables
- Statistical analyses (if applicable)
- Methodological recommendations

**Visualizations:**
- Time-series plots (publications by year)
- Pie charts (assay prevalence)
- Heatmaps (cell line vs. treatment combinations)
- Network diagrams (keyword relationships)
- Sankey diagrams (flow from stimulus → pathway → outcome)

### 4.2 Evidence Quality Assessment

Apply these filters to assess reliability:
- **Sample Size:** Number of replicates (n ≥ 3?)
- **Controls:** Proper positive/negative controls included?
- **Validation:** Multiple independent methods used?
- **Replication:** Studies confirmed by independent groups?
- **Impact Factor:** Journal quality (≥3 considered reliable)

---

## Phase 5: Tool Implementation (Automation)

### 5.1 Python/R Scripts for Batch Processing

**Bibliometric Scraping:**
```python
# Using Entrez Programming Utilities (E-utilities) for PubMed
from Bio import Entrez
Entrez.email = "your@email.com"
handle = Entrez.esearch(db="pubmed", term="IGF1[Title/Abstract] AND expression",
                        retmax=10000)
record = Entrez.read(handle)
idlist = record["IdList"]
```

**Text Mining:**
- Regular expressions to extract cell line names
- Named Entity Recognition (NER) for gene/protein mentions
- Sentiment analysis of results sections (upregulation vs. downregulation)

**Data Aggregation:**
- Pandas DataFrames for structured storage
- SQL databases for multi-table queries
- JSON export for web visualization (D3.js integration)

### 5.2 Recommended Tools

| Purpose | Tool | Notes |
|---------|------|-------|
| Citation management | Zotero / Mendeley | PDF organization, tagging |
| Bibliometric analysis | VOSviewer / CiteSpace | Network visualization |
| Systematic review | Covidence / Rayyan | Screening, duplicate removal |
| Data extraction | Excel (structured) / REDCap | Collaborative extraction |
| Visualization | R (ggplot2) / Python (matplotlib) | Custom plots |
| Text mining | spaCy / NLTK / custom regex | Entity extraction |

---

## Phase 6: Validation & Cross-Checking

### 6.1 Triangulation Approach
- Compare findings across multiple databases (PubMed vs. Scopus)
- Cross-reference with author guidelines/protocol publications
- Check against manufacturer application notes
- Verify with domain experts (contact authors if needed)

### 6.2 Red Flags to Monitor
- **Retractions:** Check PubMed Retraction Watch
- **Expression of Concern:** PubPeer discussions
- **Methodological Issues:** Underpowered studies, p-hacking
- **Industry Bias:** Industry-funded studies may report different results

---

## Expected Challenges & Solutions

| Challenge | Solution |
|-----------|----------|
| PDF access walls | Use institutional VPN, Unpaywall API, contact authors |
| Heterogeneous reporting | Create standardized extraction forms |
| Huge result sets (>10k papers) | Implement stratified sampling or focus on systematic reviews |
| Incomplete method sections | Prioritize papers with detailed protocols, use supplementary data |
| Assay naming variations | Build synonym dictionary (e.g., qPCR = real-time PCR = RT-qPCR) |
| Outdated methods | Focus on recent 10 years, but include seminal papers |

---

## Summary of Key Insights (Expected)

Based on preliminary domain knowledge, this methodology should reveal:

1. **Western blot + qPCR** remain the gold standard combination for IGF1 expression validation
2. **MC3T3-E1 and HepG2** are the most frequently used model systems for IGF1 studies
3. **GH and mechanical loading** are the most studied physiological stimuli
4. **24-48 hour time points** are the most commonly reported for expression changes
5. **Cancer and metabolic disease** contexts dominate the recent literature (>40% of papers)
6. **NGS (RNA-seq)** is rapidly replacing microarray for transcriptomic assessment

---

## References & Further Reading

- PRISMA guidelines for systematic reviews (PRISMA 2020)
- Cochrane Handbook for Systematic Reviews
- PubMed Help: Advanced Search Builder
- E-utilities Quick Start Guide (NCBI)

---

*Methodology prepared for comprehensive academic database mining of IGF1 expression research*
*Version 1.0 | Last Updated: 2025*
