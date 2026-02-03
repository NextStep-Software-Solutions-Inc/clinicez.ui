'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles, BarChart3, PieChart, LineChart, AlertCircle, Loader2 } from 'lucide-react';
import { useVisualizationRecommendation } from '@/hooks/ai/use-ai';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface VisualizationRecommenderProps {
  dataDescription: string;
  dataType?: 'appointments' | 'patient-stats' | 'clinic-metrics' | 'financial' | 'other';
  onRecommendationSelected?: (chartType: string) => void;
}

export function VisualizationRecommender({
  dataDescription,
  dataType = 'other',
  onRecommendationSelected,
}: VisualizationRecommenderProps) {
  const { recommend, recommendation, isLoading, error } = useVisualizationRecommendation();
  const [showRecommendation, setShowRecommendation] = useState(false);

  const handleRecommend = async () => {
    const result = await recommend(dataDescription, dataType);
    
    if (result) {
      setShowRecommendation(true);
    }
  };

  const getChartIcon = (chartType: string) => {
    const type = chartType.toLowerCase();
    if (type.includes('bar')) return <BarChart3 className="h-4 w-4" />;
    if (type.includes('pie') || type.includes('donut')) return <PieChart className="h-4 w-4" />;
    if (type.includes('line') || type.includes('trend')) return <LineChart className="h-4 w-4" />;
    return <BarChart3 className="h-4 w-4" />;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          AI Visualization Recommender
        </CardTitle>
        <CardDescription>
          Get AI-powered chart type recommendations for your data
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!showRecommendation && (
          <Button
            onClick={handleRecommend}
            disabled={isLoading || !dataDescription || dataDescription.trim().length === 0}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Getting Recommendations...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Get Chart Recommendations
              </>
            )}
          </Button>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {recommendation && showRecommendation && (
          <div className="space-y-4">
            {recommendation.visualizationType && recommendation.visualizationType.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-semibold">Recommended Chart Types</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {recommendation.visualizationType.map((type, idx) => (
                    <Button
                      key={idx}
                      variant="outline"
                      className="justify-start h-auto py-3"
                      onClick={() => onRecommendationSelected?.(type)}
                    >
                      {getChartIcon(type)}
                      <span className="ml-2">{type}</span>
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {recommendation.metrics && recommendation.metrics.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-semibold">Key Metrics to Display</h4>
                <div className="flex flex-wrap gap-2">
                  {recommendation.metrics.map((metric, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 text-sm rounded-md bg-primary/10 text-primary"
                    >
                      {metric}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {recommendation.suggestions && (
              <div className="space-y-2">
                <h4 className="text-sm font-semibold">AI Suggestions</h4>
                <div className="rounded-md bg-muted p-3 text-sm whitespace-pre-line">
                  {recommendation.suggestions}
                </div>
              </div>
            )}

            <Button
              onClick={handleRecommend}
              variant="outline"
              size="sm"
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Regenerating...
                </>
              ) : (
                'Get New Recommendations'
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
