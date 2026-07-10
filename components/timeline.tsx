'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Check, ChevronRight, Circle, Loader2 } from 'lucide-react';

import { cn } from '@/lib/utils';

import { Button } from '@/components/ui/button';

import { TimelineDrawer } from '@/components/timeline-drawer';

interface TimelineProps {
  entityType: string;
  entityId: string;
  currentStatus: string;
  steps: string[];
  onAdvance?: (nextStep: string) => void;
}

function labelize(step: string): string {
  return step.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export function Timeline({
  entityType,
  entityId,
  currentStatus,
  steps,
  onAdvance,
}: TimelineProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [advancing, setAdvancing] = useState(false);

  const currentIndex = steps.indexOf(currentStatus);

  const handleAdvance = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentIndex < 0 || currentIndex >= steps.length - 1) return;
    const nextStep = steps[currentIndex + 1];
    setAdvancing(true);
    try {
      await onAdvance?.(nextStep);
    } catch (err) {
      toast.error('Failed to advance to next step');
    } finally {
      setAdvancing(false);
    }
  };

  const isCompleted = (index: number) =>
    currentIndex >= 0 && index < currentIndex;
  const isCurrent = (index: number) => index === currentIndex;
  const isFuture = (index: number) =>
    currentIndex >= 0 && index > currentIndex;

  return (
    <>
      <div className="w-full overflow-x-auto pb-2">
        <div className="flex items-start min-w-max">
          {steps.map((step, index) => {
            const completed = isCompleted(index);
            const current = isCurrent(index);
            const future = isFuture(index);
            const isLast = index === steps.length - 1;
            const nextStep = steps[index + 1];

            return (
              <div
                key={step}
                className="flex items-start"
              >
                {/* Step node + content */}
                <button
                  type="button"
                  onClick={() => setDrawerOpen(true)}
                  className="group flex flex-col items-center"
                  title={`View details for ${labelize(step)}`}
                >
                  {/* Node */}
                  <div
                    className={cn(
                      'flex h-9 w-9 items-center justify-center rounded-full border-2 transition-all',
                      completed && 'border-success bg-success text-success-foreground',
                      current && 'border-info bg-info/10 text-info',
                      future && 'border-border bg-background text-muted-foreground',
                      'group-hover:scale-110'
                    )}
                  >
                    {completed && <Check className="h-4 w-4" />}
                    {current && (
                      <span className="relative flex h-3 w-3">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-info opacity-75" />
                        <span className="relative inline-flex h-3 w-3 rounded-full bg-info" />
                      </span>
                    )}
                    {future && <Circle className="h-3.5 w-3.5" />}
                  </div>

                  {/* Label */}
                  <span
                    className={cn(
                      'mt-1.5 max-w-[80px] text-center text-[11px] font-medium leading-tight transition-colors',
                      completed && 'text-success',
                      current && 'text-info',
                      future && 'text-muted-foreground',
                      'group-hover:text-foreground'
                    )}
                  >
                    {labelize(step)}
                  </span>

                  {/* Advance button on current step */}
                  {current && onAdvance && nextStep && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-1.5 h-6 px-2 text-[10px]"
                      onClick={handleAdvance}
                      disabled={advancing}
                    >
                      {advancing ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <>
                          Advance
                          <ChevronRight className="h-3 w-3 ml-0.5" />
                        </>
                      )}
                    </Button>
                  )}
                </button>

                {/* Connector line */}
                {!isLast && (
                  <div className="flex items-center mt-[18px]">
                    <div
                      className={cn(
                        'h-0.5 w-12 transition-colors',
                        completed ? 'bg-success' : 'bg-border'
                      )}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <TimelineDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        entityType={entityType}
        entityId={entityId}
        entityTitle={labelize(currentStatus)}
      />
    </>
  );
}

export default Timeline;
