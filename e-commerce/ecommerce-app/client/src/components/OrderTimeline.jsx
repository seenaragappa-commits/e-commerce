import { BadgeCheck, Check, ClipboardList, House, MapPin, Package, Truck, X } from 'lucide-react';
import { buildTimelineSteps } from '../utils/orderHelpers';
import { formatCompactDateTime, formatShortDate } from '../utils/format';

const STEP_ICONS = {
  'Order Placed': ClipboardList,
  Confirmed: BadgeCheck,
  Processing: Package,
  Shipped: Truck,
  'Out for Delivery': MapPin,
  Delivered: House,
};

const CIRCLE_STYLES = {
  done: 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/30',
  current: 'bg-blue-600 text-white shadow-md shadow-blue-600/30 ring-4 ring-blue-100',
  upcoming: 'border-2 border-slate-200 bg-white text-slate-400',
  cancelled: 'bg-red-500 text-white shadow-sm shadow-red-500/30 ring-4 ring-red-100',
};

const LABEL_STYLES = {
  done: 'text-slate-900',
  current: 'text-blue-700',
  upcoming: 'text-slate-400',
  cancelled: 'text-red-600',
};

function StepIcon({ step }) {
  if (step.state === 'done') return <Check className="h-5 w-5" strokeWidth={3} />;
  if (step.state === 'cancelled') return <X className="h-5 w-5" strokeWidth={3} />;
  const Icon = STEP_ICONS[step.status];
  return <Icon className="h-[18px] w-[18px]" />;
}

const getStepDetail = (step, order) => {
  if (step.date) return formatCompactDateTime(step.date);
  if (step.state === 'current') return 'In progress';
  if (step.status === 'Delivered' && order.estimatedDelivery) return `Expected ${formatShortDate(order.estimatedDelivery)}`;
  return step.state === 'done' ? 'Completed' : 'Pending';
};

/**
 * Visual order-tracking timeline: ✓ done, ● current, ○ upcoming.
 * Vertical on phones, horizontal on larger screens.
 */
export default function OrderTimeline({ order }) {
  const steps = buildTimelineSteps(order);

  return (
    <ol className="flex flex-col md:flex-row" aria-label="Order tracking timeline">
      {steps.map((step, index) => {
        const next = steps[index + 1];
        let connectorColor = 'bg-slate-200';
        if (next?.state === 'cancelled') connectorColor = 'bg-red-300';
        else if (next && next.state !== 'upcoming') connectorColor = 'bg-emerald-400';

        return (
          <li
            key={step.status}
            className="relative flex gap-4 pb-8 last:pb-0 md:flex-1 md:flex-col md:items-center md:gap-3 md:pb-0 md:text-center"
            aria-current={step.state === 'current' ? 'step' : undefined}
          >
            {next && (
              <span
                aria-hidden="true"
                className={`absolute top-10 left-5 -ml-px h-[calc(100%-2.5rem)] w-0.5 md:top-5 md:left-[calc(50%+1.25rem)] md:ml-0 md:h-0.5 md:w-[calc(100%-2.5rem)] ${connectorColor}`}
              />
            )}

            <span className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${CIRCLE_STYLES[step.state]}`}>
              {step.state === 'current' && (
                <span className="absolute inset-0 animate-ping rounded-full bg-blue-500 opacity-25" aria-hidden="true" />
              )}
              <StepIcon step={step} />
            </span>

            <div className="min-w-0 pt-1 md:px-1 md:pt-0">
              <p className={`text-sm font-bold ${LABEL_STYLES[step.state]}`}>
                {step.status}
                {step.state === 'current' && <span className="sr-only"> (current status)</span>}
              </p>
              <p className={`mt-0.5 text-xs ${step.state === 'upcoming' ? 'text-slate-400' : 'text-slate-500'}`}>
                {getStepDetail(step, order)}
              </p>
              {step.state === 'current' && (
                <span className="mt-1.5 inline-block rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700 ring-1 ring-blue-600/15">
                  Current status
                </span>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
