/**
 * Childcare Advisor Tools
 * Specialized tools for sleep, feeding, milestones, and safety
 * Using Vercel AI SDK v4 with both function and data tools
 */

import { tool } from 'ai';
import { z } from 'zod';

// ============================================================================
// FUNCTION TOOLS (Auto-Execute)
// Tools that perform calculations and return structured data
// ============================================================================

/**
 * Sleep Quality Calculator
 * Calculates sleep scores and recommendations based on child's sleep data
 */
export const sleepQualityTool = tool({
  description: 'Calculate sleep quality score and recommendations for a child based on sleep duration, interruptions, and timing',
  parameters: z.object({
    sleepHours: z.number().min(0).max(24).describe('Total hours of sleep'),
    ageMonths: z.number().min(0).max(216).describe('Child age in months'),
    interruptions: z.number().min(0).describe('Number of wake-ups during sleep'),
    napCount: z.number().min(0).max(5).describe('Number of naps today'),
    bedtime: z.string().regex(/^\d{1,2}:\d{2}$/).describe('Bedtime in HH:MM format'),
    wakeTime: z.string().regex(/^\d{1,2}:\d{2}$/).describe('Wake time in HH:MM format'),
  }),
  execute: async ({ sleepHours, ageMonths, interruptions, napCount, bedtime, wakeTime }) => {
    // Calculate expected sleep by age
    let expectedSleep: number;
    let expectedNaps: number;

    if (ageMonths <= 1) { expectedSleep = 16; expectedNaps = 4; }
    else if (ageMonths <= 3) { expectedSleep = 15; expectedNaps = 4; }
    else if (ageMonths <= 6) { expectedSleep = 14; expectedNaps = 3; }
    else if (ageMonths <= 9) { expectedSleep = 13; expectedNaps = 2; }
    else if (ageMonths <= 12) { expectedSleep = 12.5; expectedNaps = 2; }
    else if (ageMonths <= 18) { expectedSleep = 12; expectedNaps = 1; }
    else if (ageMonths <= 36) { expectedSleep = 11; expectedNaps = 1; }
    else { expectedSleep = 10; expectedNaps = 0; }

    // Calculate score
    let score = 100;

    // Sleep duration adjustment
    const sleepDiff = Math.abs(sleepHours - expectedSleep);
    if (sleepDiff > 2) score -= 20;
    else if (sleepDiff > 1) score -= 10;
    else if (sleepDiff > 0.5) score -= 5;

    // Interruptions penalty
    score -= interruptions * 10;

    // Nap count check
    const napDiff = Math.abs(napCount - expectedNaps);
    if (napDiff > 0) score -= 5 * napDiff;

    // Bedtime analysis
    const [bedHour, bedMin] = bedtime.split(':').map(Number);
    const bedTimeDecimal = bedHour + bedMin / 60;

    if (ageMonths < 12) {
      if (bedTimeDecimal > 21) score -= 10; // Too late for babies
    } else {
      if (bedTimeDecimal > 21) score -= 5;
      if (bedTimeDecimal < 18) score -= 5; // Unusually early
    }

    score = Math.max(0, Math.min(100, score));

    // Quality category
    let quality: string;
    if (score >= 90) quality = 'excellent';
    else if (score >= 75) quality = 'good';
    else if (score >= 60) quality = 'fair';
    else quality = 'poor';

    // Generate recommendations
    const recommendations: string[] = [];

    if (sleepHours < expectedSleep - 1) {
      recommendations.push(`Try to increase sleep by ${(expectedSleep - sleepHours).toFixed(1)} hours to meet ${expectedSleep}hr target for ${ageMonths} month old`);
    }

    if (interruptions > 2) {
      recommendations.push(interruptions > 4 
        ? 'Many wake-ups detected. Consider white noise, room temperature check, or possible sleep regression'
        : 'Consider sleep environment improvements: blackout curtains, consistent temperature, white noise'
      );
    }

    if (napCount < expectedNaps) {
      recommendations.push(`Aim for ${expectedNaps} naps to prevent overtiredness`);
    } else if (napCount > expectedNaps) {
      recommendations.push('Consider consolidating naps if nighttime sleep is disrupted');
    }

    if (bedTimeDecimal > 20 && ageMonths < 24) {
      recommendations.push('Consider earlier bedtime (7-8 PM) for better overnight sleep quality');
    }

    return {
      score,
      quality,
      expectedSleep,
      actualSleep: sleepHours,
      sleepDelta: sleepHours - expectedSleep,
      recommendations,
      napAnalysis: {
        actualNaps: napCount,
        expectedNaps,
        isOptimal: napCount === expectedNaps,
      },
      timestamp: new Date().toISOString(),
    };
  },
});

/**
 * Wake Window Calculator
 * Calculates optimal wake windows and nap timing
 */
export const wakeWindowTool = tool({
  description: 'Calculate optimal wake windows and nap/bedtime recommendations for a child',
  parameters: z.object({
    ageMonths: z.number().min(0).max(216).describe('Child age in months'),
    wakeTime: z.string().regex(/^\d{1,2}:\d{2}$/).describe('Morning wake time in HH:MM'),
    napCount: z.number().min(0).max(5).describe('Target number of naps'),
  }),
  execute: async ({ ageMonths, wakeTime, napCount }) => {
    // Parse wake time
    const [hour, min] = wakeTime.split(':').map(Number);
    let currentTime = hour * 60 + min; // Convert to minutes from midnight

    // Wake windows by age (in minutes)
    let wakeWindow1: number;
    let wakeWindow2: number;
    let wakeWindow3: number;
    let wakeWindow4: number;
    let lastWindow: number;

    if (ageMonths <= 3) {
      wakeWindow1 = 90; wakeWindow2 = 90; wakeWindow3 = 90;
      wakeWindow4 = 90; lastWindow = 90;
    } else if (ageMonths <= 6) {
      wakeWindow1 = 120; wakeWindow2 = 150; wakeWindow3 = 150;
      wakeWindow4 = 120; lastWindow = 120;
    } else if (ageMonths <= 9) {
      wakeWindow1 = 150; wakeWindow2 = 180; wakeWindow3 = 180;
      wakeWindow4 = 180; lastWindow = 180;
    } else if (ageMonths <= 12) {
      wakeWindow1 = 180; wakeWindow2 = 210; wakeWindow3 = 210;
      wakeWindow4 = 240; lastWindow = 240;
    } else if (ageMonths <= 18) {
      wakeWindow1 = 210; wakeWindow2 = 240; wakeWindow3 = 0;
      wakeWindow4 = 0; lastWindow = 300; // 5 hours
    } else if (ageMonths <= 36) {
      wakeWindow1 = 300; wakeWindow2 = 360; wakeWindow3 = 0;
      wakeWindow4 = 0; lastWindow = 360; // 6 hours
    } else {
      wakeWindow1 = 360; wakeWindow2 = 0; wakeWindow3 = 0;
      wakeWindow4 = 0; lastWindow = 420; // 7 hours
    }

    // Calculate schedule
    const schedule: Array<{ type: string; time: string; duration?: number }> = [];

    // Wake
    schedule.push({
      type: 'wake',
      time: `${String(Math.floor(currentTime / 60)).padStart(2, '0')}:${String(currentTime % 60).padStart(2, '0')}`,
    });

    // Nap 1
    if (napCount >= 1) {
      currentTime += wakeWindow1;
      const nap1Start = currentTime;
      schedule.push({
        type: 'nap1',
        time: `${String(Math.floor(currentTime / 60)).padStart(2, '0')}:${String(currentTime % 60).padStart(2, '0')}`,
        duration: ageMonths < 6 ? 120 : 90, // Baby naps are longer
      });
      currentTime += ageMonths < 6 ? 120 : 90;
    }

    // Nap 2
    if (napCount >= 2) {
      currentTime += wakeWindow2;
      schedule.push({
        type: 'nap2',
        time: `${String(Math.floor(currentTime / 60)).padStart(2, '0')}:${String(currentTime % 60).padStart(2, '0')}`,
        duration: ageMonths < 9 ? 90 : 60,
      });
      currentTime += ageMonths < 9 ? 90 : 60;
    }

    // Nap 3
    if (napCount >= 3) {
      currentTime += wakeWindow3;
      schedule.push({
        type: 'nap3',
        time: `${String(Math.floor(currentTime / 60)).padStart(2, '0')}:${String(currentTime % 60).padStart(2, '0')}`,
        duration: 45,
      });
      currentTime += 45;
    }

    // Nap 4
    if (napCount >= 4) {
      currentTime += wakeWindow4;
      schedule.push({
        type: 'nap4',
        time: `${String(Math.floor(currentTime / 60)).padStart(2, '0')}:${String(currentTime % 60).padStart(2, '0')}`,
        duration: 30,
      });
      currentTime += 30;
    }

    // Bedtime
    currentTime += lastWindow;
    schedule.push({
      type: 'bedtime',
      time: `${String(Math.floor(currentTime / 60)).padStart(2, '0')}:${String(currentTime % 60).padStart(2, '0')}`,
    });

    return {
      ageMonths,
      wakeTime,
      napCount,
      wakeWindows: {
        window1: wakeWindow1,
        window2: wakeWindow2,
        window3: wakeWindow3 || undefined,
        lastWindow,
      },
      recommendedSchedule: schedule,
      totalSleep: napCount > 0
        ? schedule.filter(s => s.type.includes('nap')).reduce((acc, s) => acc + (s.duration || 0), 0) / 60
        : 0,
    };
  },
});

/**
 * Feeding Calculator
 * Calculates feeding amounts and nutrition based on age
 */
export const feedingCalculatorTool = tool({
  description: 'Calculate optimal feeding amounts, schedules, and nutritional recommendations for a child',
  parameters: z.object({
    ageMonths: z.number().min(0).max(216).describe('Child age in months'),
    weightKg: z.number().min(0.5).max(100).describe('Weight in kilograms'),
    feedingType: z.enum(['breast', 'bottle', 'mixed', 'solid']).describe('Type of feeding'),
    feedingsToday: z.number().min(0).default(0).describe('Number of feedings already today'),
  }),
  execute: async ({ ageMonths, weightKg, feedingType, feedingsToday }) => {
    // Calculate daily milk needs
    const dailyMilkOz = Math.max(weightKg * 2.5, 19.2); // Min 19.2oz for infants

    // Calculate per feeding
    let recommendedPerFeed: number;
    let recommendedDailyFeeds: number;

    if (ageMonths <= 1) { recommendedPerFeed = 2; recommendedDailyFeeds = 8; }
    else if (ageMonths <= 2) { recommendedPerFeed = 3; recommendedDailyFeeds = 8; }
    else if (ageMonths <= 3) { recommendedPerFeed = 4; recommendedDailyFeeds = 7; }
    else if (ageMonths <= 6) { recommendedPerFeed = 6; recommendedDailyFeeds = 6; }
    else if (ageMonths <= 9) { recommendedPerFeed = 7; recommendedDailyFeeds = 5; }
    else if (ageMonths <= 12) { recommendedPerFeed = 7; recommendedDailyFeeds = 4; }
    else { recommendedPerFeed = 8; recommendedDailyFeeds = 3; }

    // Solid food recommendations
    const solidFoods: string[] = [];
    if (ageMonths >= 4) solidFoods.push('Rice cereal (iron-fortified)');
    if (ageMonths >= 6) {
      solidFoods.push('Pureed vegetables (sweet potato, carrots)');
      solidFoods.push('Pureed fruits (banana, avocado)');
      solidFoods.push('Thin oatmeal');
    }
    if (ageMonths >= 7) {
      solidFoods.push('Mashed proteins (beans, yogurt, scrambled eggs if no allergy)');
      solidFoods.push('Soft finger foods (cooked carrots, banana pieces)');
    }
    if (ageMonths >= 9) {
      solidFoods.push('Soft table foods (well-cooked pasta, soft bread)');
      solidFoods.push('Cheese (pasteurized)');
    }
    if (ageMonths >= 12) {
      solidFoods.push('Cow\'s milk (whole)');
      solidFoods.push('Honey (safe after 12 months)');
      solidFoods.push('Family foods (appropriately sized)');
    }

    // Calculate today's target
    const remainingFeeds = Math.max(0, recommendedDailyFeeds - feedingsToday);
    const totalNeededToday = dailyMilkOz;
    const remainingOz = Math.max(0, totalNeededToday - (feedingsToday * recommendedPerFeed));

    return {
      ageMonths,
      weightKg,
      feedingType,
      recommendations: {
        dailyMilkOunces: dailyMilkOz,
        perFeedingOunces: recommendedPerFeed,
        dailyFeeds: recommendedDailyFeeds,
        remainingFeedsToday: remainingFeeds,
        remainingOuncesToday: remainingOz,
      },
      solidFoods: ageMonths >= 4 ? solidFoods : [],
      schedule: Array.from({ length: recommendedDailyFeeds }, (_, i) => {
        const baseHour = ageMonths < 6 ? 2 : 4; // Feed every 2-4 hours
        return {
          feed: i + 1,
          time: `${String((6 + i * baseHour) % 24).padStart(2, '0')}:00`,
          amount: `${recommendedPerFeed} oz`,
        };
      }),
      milestones: {
        canStartSolids: ageMonths >= 4,
        typicalSolidsStart: ageMonths >= 6,
        selfFeeding: ageMonths >= 9,
        transitionToCowMilk: ageMonths >= 12,
      },
    };
  },
});

/**
 * Milestone Checker
 * Checks developmental milestones by age
 */
export const milestoneCheckerTool = tool({
  description: 'Check developmental milestones expected at a child\'s age and identify any gaps or red flags',
  parameters: z.object({
    ageMonths: z.number().min(0).max(72).describe('Child age in months'),
    achievedMilestones: z.array(z.string()).describe('List of milestones already achieved'),
  }),
  execute: async ({ ageMonths, achievedMilestones }) => {
    // Define milestones by age range
    const expectedMilestones: string[] = [];
    const emergingMilestones: string[] = [];
    const redFlags: string[] = [];

    // 0-3 months
    if (ageMonths >= 0) {
      expectedMilestones.push(
        'Responds to sounds',
        'Follows objects with eyes',
        'Smiles responsively',
        'Lifts head during tummy time',
        'Brings hands to mouth'
      );
    }

    // 3-6 months
    if (ageMonths >= 3) {
      expectedMilestones.push(
        'Rolls over (front to back)',
        'Laughs',
        'Reaches for toys',
        'Recognizes faces',
        'Babbles'
      );
      if (!achievedMilestones.includes('Smiles responsively')) {
        redFlags.push('6 months: Not smiling or showing responsive emotion');
      }
    }

    // 6-9 months
    if (ageMonths >= 6) {
      expectedMilestones.push(
        'Sits without support',
        'Crawls',
        'Responds to name',
        'Says consonant sounds (ba, da)',
        'Passes objects between hands'
      );
      emergingMilestones.push('Pulls to stand');
      if (!achievedMilestones.includes('Babbles')) {
        redFlags.push('9 months: Not babbling');
      }
    }

    // 9-12 months
    if (ageMonths >= 9) {
      expectedMilestones.push(
        'Pulls to stand',
        'Stands holding furniture',
        'Waves bye-bye',
        'Understands "no"',
        'Plays peek-a-boo'
      );
    }

    // 12-18 months
    if (ageMonths >= 12) {
      expectedMilestones.push(
        'Walks independently',
        'Says 3+ words',
        'Follows 1-step instructions',
        'Points to things they want',
        'Uses gestures (shaking head, pointing)'
      );
      if (!achievedMilestones.some(m => m.includes('words'))) {
        redFlags.push('18 months: Not using words with meaning');
      }
    }

    // 18-24 months
    if (ageMonths >= 18) {
      expectedMilestones.push(
        'Walks backwards',
        'Uses 50+ words',
        '2-word phrases',
        'Shows defiant behavior',
        'Can sort shapes'
      );
      emergingMilestones.push('Runs without tripping');
      if (!achievedMilestones.some(m => m.includes('2-word'))) {
        redFlags.push('24 months: Not combining words (2-word phrases)');
      }
    }

    // 24-36 months
    if (ageMonths >= 24) {
      expectedMilestones.push(
        'Runs without tripping',
        'Jumps with both feet',
        'Climbs stairs',
        'Uses 3-word sentences',
        'Plays pretend',
        'Shows affection'
      );
    }

    // Check for achieved vs expected
    const achieved = expectedMilestones.filter(m => 
      achievedMilestones.some(a => 
        a.toLowerCase().includes(m.toLowerCase()) || 
        m.toLowerCase().includes(a.toLowerCase())
      )
    );

    const pending = expectedMilestones.filter(m => 
      !achievedMilestones.some(a => 
        a.toLowerCase().includes(m.toLowerCase()) || 
        m.toLowerCase().includes(a.toLowerCase())
      )
    );

    // Calculate progress
    const progress = expectedMilestones.length > 0 
      ? Math.round((achieved.length / expectedMilestones.length) * 100) 
      : 100;

    return {
      ageMonths,
      expectedMilestones: expectedMilestones.length,
      achievedCount: achieved.length,
      pendingCount: pending.length,
      progress,
      status: progress >= 80 ? 'on_track' : progress >= 60 ? 'progressing' : 'needs_attention',
      redFlags,
      achieved,
      pending,
      emerging: emergingMilestones,
      recommendations: redFlags.length > 0 
        ? ['Consider discussing red flags with pediatrician'] 
        : pending.length > 0 
          ? ['Practice pending skills daily', 'Encourage play that supports development'] 
          : ['Great progress! Keep supporting growth through play'],
    };
  },
});

/**
 * Temperature Safety Checker
 * For fever assessment in children
 */
export const temperatureSafetyTool = tool({
  description: 'Evaluate if a child\'s temperature indicates fever severity and recommend actions',
  parameters: z.object({
    temperature: z.number().min(95).max(108).describe('Temperature in Fahrenheit'),
    ageMonths: z.number().min(0).max(216).describe('Child age in months'),
    measurementType: z.enum(['oral', 'rectal', 'axillary', 'temporal', 'tympanic']).describe('How temperature was measured'),
    symptoms: z.array(z.string()).describe('Current symptoms'),
  }),
  execute: async ({ temperature, ageMonths, measurementType, symptoms }) => {
    // Adjust for measurement type
    let adjustedTemp = temperature;
    if (measurementType === 'axillary') adjustedTemp += 1.0; // Add 1°F for underarm
    else if (measurementType === 'temporal') adjustedTemp += 0.5; // Add 0.5°F for forehead

    // Determine fever level
    let severity: string;
    let action: string;

    if (adjustedTemp < 98.6) {
      severity = 'normal';
      action = 'No action needed. Temperature is normal.';
    } else if (adjustedTemp < 100.4) {
      severity = 'low_grade';
      action = 'Low-grade fever. Monitor and provide comfort measures.';
    } else if (adjustedTemp < 102) {
      severity = 'mild';
      action = ageMonths < 3
        ? 'Mild fever but under 3 months - contact pediatrician'
        : 'Mild fever. Monitor, give fluids, and check every 2-4 hours.';
    } else if (adjustedTemp < 104) {
      severity = 'moderate';
      action = 'Moderate fever. Give fever reducer, ensure hydration, contact pediatrician.';
    } else {
      severity = 'high';
      action = 'High fever. IMMEDIATE pediatrician or emergency care contact.';
    }

    // Critical flags
    const criticalFlags: string[] = [];

    if (ageMonths < 3 && adjustedTemp >= 100.4) {
      criticalFlags.push('Under 3 months with fever: Contact doctor immediately');
    }

    if (!symptoms.includes('responsive') && !symptoms.includes('alert')) {
      criticalFlags.push('Not responsive or alert: Seek medical attention');
    }

    if (symptoms.includes('stiff neck')) {
      criticalFlags.push('Stiff neck with fever: Possible meningitis - emergency care');
    }

    if (symptoms.includes('difficulty breathing')) {
      criticalFlags.push('Breathing difficulty: Emergency care');
    }

    return {
      originalTemperature: temperature,
      measurementType,
      adjustedTemperature: adjustedTemp,
      feverCategory: severity,
      recommendation: action,
      safeFeverReducer: ageMonths >= 2
        ? ['Acetaminophen (Tylenol): Check with pediatrician for dosing', 'Ibuprofen (Advil/Motrin): Only if age 6+ months']
        : 'DO NOT give fever reducer without pediatrician approval under 2 months',
      comfortMeasures: ageMonths < 6 
        ? ['Light clothing', 'Keep room comfortable (68-72°F)', 'Continue breastfeeding/formula']
        : ['Light clothing', 'Lukewarm bath (not cold)', 'Fluids', 'Rest', 'Keep room 68-72°F'],
      seekMedicalCare: criticalFlags.length > 0 || adjustedTemp >= 104 || (ageMonths < 3 && adjustedTemp >= 100.4),
      criticalFlags,
    };
  },
});

// ============================================================================
// DATA TOOLS (Manual Injection)
// Tools that provide context for the model without auto-execution
// ============================================================================

/**
 * Child Profile Data Tool
 * Provides child's profile information
 */
export const childProfileDataTool = tool({
  description: 'Retrieve child profile information: age, weight, feeding type, sleep patterns, and general characteristics. Call this first to understand who we\'re advising about.',
  parameters: z.object({
    childId: z.string().describe('Unique identifier for the child'),
  }),
  // NO execute - data provided manually from database
});

/**
 * Historical Sleep Data Tool
 * Provides past week's sleep data
 */
export const historicalSleepDataTool = tool({
  description: 'Get past sleep history and patterns for a child to identify trends and issues',
  parameters: z.object({
    childId: z.string().describe('Unique identifier for the child'),
    days: z.number().default(7).describe('Number of days of history'),
  }),
  // NO execute - data from database
});

/**
 * Feeding History Data Tool
 * Provides feeding records
 */
export const feedingHistoryDataTool = tool({
  description: 'Get recent feeding history and nutrition data for a child',
  parameters: z.object({
    childId: z.string().describe('Unique identifier for the child'),
    days: z.number().default(3).describe('Number of days of history'),
  }),
  // NO execute - data from database
});

/**
 * Milestone Progress Data Tool
 * Provides which milestones are achieved
 */
export const milestoneProgressDataTool = tool({
  description: 'Get current milestone status and achievements for a child',
  parameters: z.object({
    childId: z.string().describe('Unique identifier for the child'),
    category: z.enum(['physical', 'cognitive', 'language', 'social']).optional(),
  }),
  // NO execute - data from database
});

/**
 * Safety Guidelines Data Tool
 * Provides age-appropriate safety information
 */
export const safetyGuidelinesDataTool = tool({
  description: 'Get current safety guidelines and recommendations for a child\'s age group',
  parameters: z.object({
    ageMonths: z.number().describe('Child age in months'),
    category: z.enum(['general', 'sleep', 'feeding', 'play', 'travel']).default('general'),
  }),
  // NO execute - data from database
});

// ============================================================================
// EXPORTS
// ============================================================================

export const functionTools = {
  sleepQuality: sleepQualityTool,
  wakeWindow: wakeWindowTool,
  feedingCalculator: feedingCalculatorTool,
  milestoneChecker: milestoneCheckerTool,
  temperatureSafety: temperatureSafetyTool,
};

export const dataTools = {
  childProfile: childProfileDataTool,
  historicalSleep: historicalSleepDataTool,
  feedingHistory: feedingHistoryDataTool,
  milestoneProgress: milestoneProgressDataTool,
  safetyGuidelines: safetyGuidelinesDataTool,
};

export const allTools = {
  ...functionTools,
  ...dataTools,
};
