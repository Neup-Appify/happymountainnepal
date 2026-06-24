'use server';

import { z } from 'zod';

const ConversationPartSchema = z.object({
  role: z.enum(['user', 'model']),
  text: z.string(),
});

const CustomizeTripInputSchema = z.array(ConversationPartSchema);
export type CustomizeTripInput = z.infer<typeof CustomizeTripInputSchema>;

const CustomizeTripOutputSchema = z.object({
  nextQuestion: z.string(),
  isFinished: z.boolean(),
});
export type CustomizeTripOutput = z.infer<typeof CustomizeTripOutputSchema>;

function hasContactInfo(text: string) {
  const hasEmail = /[^\s@]+@[^\s@]+\.[^\s@]+/.test(text);
  const hasPhoneWithCountryCode = /\+\d[\d\s().-]{6,}/.test(text);
  return hasEmail || hasPhoneWithCountryCode;
}

export async function customizeTrip(input: CustomizeTripInput): Promise<CustomizeTripOutput> {
  const conversation = CustomizeTripInputSchema.parse(input);
  const userTurns = conversation.filter(part => part.role === 'user');
  const firstMessage = userTurns[0]?.text || '';

  if (!hasContactInfo(firstMessage)) {
    return {
      isFinished: false,
      nextQuestion: 'Thank you for your interest. Could you please provide an email address or a phone number with country code so our team can follow up?',
    };
  }

  const questionCount = userTurns.length;
  if (questionCount <= 1) {
    return {
      isFinished: false,
      nextQuestion: 'What is your ideal trip duration, and do you have preferred travel dates?',
    };
  }

  if (questionCount === 2) {
    return {
      isFinished: false,
      nextQuestion: 'What is your fitness level and preferred comfort level for accommodation?',
    };
  }

  if (questionCount === 3) {
    return {
      isFinished: false,
      nextQuestion: 'Are there specific regions, experiences, or activities you want included?',
    };
  }

  return {
    isFinished: true,
    nextQuestion: 'Thank you. We have everything we need to create your personalized plan and will be in touch shortly.',
  };
}
