'use server';

import { summarizePredictionInsights } from '@/ai/flows/summarize-prediction-insights';
import { explainPredictionReasoning } from '@/ai/flows/explain-prediction-reasoning';
import { runModel1, runModel2, runModel3, runSecondLayerModel, generateStatistics } from '@/lib/mock-models';

export type PredictionData = {
    output1: string;
    output2: string;
    output3: string;
    secondLayerOutput: string;
    statistics: string;
    summary: string;
};

export async function runPredictionFlow(initialData: string): Promise<{ data?: PredictionData; error?: string }> {
    try {
        const [output1, output2, output3] = await Promise.all([
            runModel1(initialData),
            runModel2(initialData),
            runModel3(initialData),
        ]);

        const secondLayerOutput = await runSecondLayerModel([output1, output2, output3]);

        const allOutputs = [output1, output2, output3, secondLayerOutput];
        const statistics = await generateStatistics(allOutputs);

        const summaryResult = await summarizePredictionInsights({
            modelOutputs: allOutputs,
            statisticalData: statistics,
        });

        return {
            data: {
                output1,
                output2,
                output3,
                secondLayerOutput,
                statistics,
                summary: summaryResult.summary,
            }
        };
    } catch (e) {
        console.error(e);
        return { error: 'An error occurred during the prediction flow. Please check the server logs.' };
    }
}


export async function getExplanation(question: string, statistics: string): Promise<{ data?: string; error?: string }> {
    if (!question || !statistics) {
        return { error: 'Invalid input for explanation.' };
    }

    try {
        const result = await explainPredictionReasoning({
            prediction: question,
            statisticalData: statistics,
        });
        return { data: result.explanation };
    } catch (e) {
        console.error(e);
        return { error: 'Failed to get an explanation from the AI model.' };
    }
}
