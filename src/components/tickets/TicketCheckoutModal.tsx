import { useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useTicketCartStore } from "@/stores/ticketCartStore";
import { TicketTypeSelection } from "./TicketTypeSelection";
import { SeatSelection } from "./SeatSelection";
import { MerchBundleUpsell } from "./MerchBundleUpsell";
import { CartReview } from "./CartReview";
import { TicketConfirmation } from "./TicketConfirmation";

interface TicketCheckoutModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  show: {
    id: string;
    venue: string;
    date: string;
    city: string;
  } | null;
}

const STEP_LABELS = [
  "Section",
  "Tickets",
  "Bundles",
  "Review",
  "Confirmed"
];

export function TicketCheckoutModal({ open, onOpenChange, show }: TicketCheckoutModalProps) {
  const { currentStep, setShow, nextStep, prevStep, resetCart } = useTicketCartStore();

  useEffect(() => {
    if (show && open) {
      setShow(show.id, show.venue, show.date, show.city);
    }
  }, [show, open, setShow]);

  const handleClose = () => {
    resetCart();
    onOpenChange(false);
  };

  if (!show) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl md:max-w-4xl lg:max-w-5xl max-h-[90vh] overflow-y-auto bg-background border-border">
        <DialogHeader>
          <DialogTitle className="text-center">
            {currentStep < 5 ? (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground font-normal">
                  {show.venue}
                </p>
                
                {/* Step Indicator */}
                <div className="flex items-center justify-center gap-2">
                  {STEP_LABELS.slice(0, 4).map((label, idx) => {
                    const stepNum = idx + 1;
                    const isActive = currentStep === stepNum;
                    const isComplete = currentStep > stepNum;
                    
                    return (
                      <div key={label} className="flex items-center gap-2">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                            isActive
                              ? 'bg-primary text-primary-foreground'
                              : isComplete
                              ? 'bg-primary/30 text-primary'
                              : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          {stepNum}
                        </div>
                        {idx < 3 && (
                          <div
                            className={`w-8 h-0.5 ${
                              isComplete ? 'bg-primary' : 'bg-muted'
                            }`}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
                
                <p className="text-xs text-muted-foreground">
                  Step {currentStep} of 4: {STEP_LABELS[currentStep - 1]}
                </p>
              </div>
            ) : (
              <span className="sr-only">Order Confirmed</span>
            )}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Purchase tickets for {show.venue}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4">
          {currentStep === 1 && (
            <SeatSelection
              showId={show.id}
              onNext={nextStep}
              onBack={() => {}}
            />
          )}
          
          {currentStep === 2 && (
            <TicketTypeSelection
              showId={show.id}
              onNext={nextStep}
              onBack={prevStep}
            />
          )}
          
          {currentStep === 3 && (
            <MerchBundleUpsell
              onNext={nextStep}
              onBack={prevStep}
            />
          )}
          
          {currentStep === 4 && (
            <CartReview
              onNext={nextStep}
              onBack={prevStep}
            />
          )}
          
          {currentStep === 5 && (
            <TicketConfirmation
              onClose={handleClose}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
