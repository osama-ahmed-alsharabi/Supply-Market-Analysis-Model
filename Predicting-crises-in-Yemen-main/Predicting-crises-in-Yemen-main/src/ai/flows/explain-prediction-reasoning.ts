'use server';
/**
 * @fileOverview Provides a Genkit flow to explain the reasoning behind a model's prediction.
 *
 * - explainPredictionReasoning - A function that takes a prediction and asks Gemini for an explanation.
 * - ExplainPredictionReasoningInput - The input type for the explainPredictionReasoning function.
 * - ExplainPredictionReasoningOutput - The return type for the explainPredictionReasoning function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ExplainPredictionReasoningInputSchema = z.object({
    prediction: z.string().describe('The prediction to explain.'),
    statisticalData: z.string().describe('The statistical data related to the prediction.'),
});
export type ExplainPredictionReasoningInput = z.infer<
    typeof ExplainPredictionReasoningInputSchema
>;

const ExplainPredictionReasoningOutputSchema = z.object({
    explanation: z.string().describe('The logical explanation of the prediction.'),
});
export type ExplainPredictionReasoningOutput = z.infer<
    typeof ExplainPredictionReasoningOutputSchema
>;

export async function explainPredictionReasoning(
    input: ExplainPredictionReasoningInput
): Promise<ExplainPredictionReasoningOutput> {
    return explainPredictionReasoningFlow(input);
}

const explainPredictionReasoningPrompt = ai.definePrompt({
    name: 'explainPredictionReasoningPrompt',
    input: { schema: ExplainPredictionReasoningInputSchema },
    output: { schema: ExplainPredictionReasoningOutputSchema },
    prompt: `You are a Senior Risk Advisor explaining a crisis prediction to the Board of Directors.
  
  Prediction Context: {{{prediction}}}
  Risk Statistics: {{{statisticalData}}}

  Provide a logical, data-backed explanation for this prediction. 
  - Translate complex signals into clear business risks.
  - Focus on the *Why* and the *Consequences*.
  - Use professional, "Manager/Observer" appropriate language. 
  - Be concise but thorough.`,
});

const explainPredictionReasoningFlow = ai.defineFlow(
    {
        name: 'explainPredictionReasoningFlow',
        inputSchema: ExplainPredictionReasoningInputSchema,
        outputSchema: ExplainPredictionReasoningOutputSchema,
    },
    async input => {
        const { output } = await explainPredictionReasoningPrompt(input);
        return output!;
    }
);
