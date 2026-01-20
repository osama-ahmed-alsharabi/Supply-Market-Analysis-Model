'use server';

/**
 * @fileOverview Summarizes prediction insights from the models.
 *
 * - summarizePredictionInsights - A function that summarizes the prediction insights.
 * - SummarizePredictionInsightsInput - The input type for the summarizePredictionInsights function.
 * - SummarizePredictionInsightsOutput - The return type for the summarizePredictionInsights function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const SummarizePredictionInsightsInputSchema = z.object({
    modelOutputs: z.array(z.string()).describe('The outputs from the various models.'),
    statisticalData: z.string().describe('The statistical data from the models.'),
});
export type SummarizePredictionInsightsInput = z.infer<typeof SummarizePredictionInsightsInputSchema>;

const SummarizePredictionInsightsOutputSchema = z.object({
    summary: z.string().describe('A concise summary of the key insights and predictions.'),
});
export type SummarizePredictionInsightsOutput = z.infer<typeof SummarizePredictionInsightsOutputSchema>;

export async function summarizePredictionInsights(input: SummarizePredictionInsightsInput): Promise<SummarizePredictionInsightsOutput> {
    return summarizePredictionInsightsFlow(input);
}

const summarizePredictionInsightsPrompt = ai.definePrompt({
    name: 'summarizePredictionInsightsPrompt',
    input: { schema: SummarizePredictionInsightsInputSchema },
    output: { schema: SummarizePredictionInsightsOutputSchema },
    prompt: `You are a Strategic Crisis Analyst for a major commercial group.
  Your goal is to synthesize data from multiple sources to predict potential crises BEFORE they happen.

  Here are the raw model outputs:
  {{#each modelOutputs}}
  - {{{this}}}
  {{/each}}

  Here is the statistical risk assessment:
  {{{statisticalData}}}

  Title your summary: **Strategic Risk Briefing**
  
  Please provide a high-level executive summary using the following structure:
  1. **Bottom Line Up Front (BLUF)**: The most critical risk and its probability.
  2. **Core Drivers**: Why is this happening? (Cite the model outputs).
  3. **Strategic Implications**: What does this mean for the business (Financial/Operational)?
  
  Tone: Professional, Critical, Direct, and Action-Oriented. Avoid fluff.`,
});

const summarizePredictionInsightsFlow = ai.defineFlow(
    {
        name: 'summarizePredictionInsightsFlow',
        inputSchema: SummarizePredictionInsightsInputSchema,
        outputSchema: SummarizePredictionInsightsOutputSchema,
    },
    async input => {
        const { output } = await summarizePredictionInsightsPrompt(input);
        return output!;
    }
);
