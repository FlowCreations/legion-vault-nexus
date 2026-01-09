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
    seatingType: 'reserved' | 'general_admission';
  } | null;
}

// Step labels vary based on seating type
const RESERVED_STEP_LABELS = ["Section", "Tickets", "Bundles", "Review", "Confirmed"];
const GA_STEP_LABELS = ["Tickets", "Bundles", "Review", "Confirmed"];

export function TicketCheckoutModal({ open, onOpenChange, show }: TicketCheckoutModalProps) {
  const { currentStep, setShow, nextStep, prevStep, resetCart, setStep, orderConfirmed } = useTicketCartStore();
  
  const isGeneralAdmission = show?.seatingType === 'general_admission';
  // For GA venues: skip step 1 (seat selection), start at step 2
  const adjustedStep = isGeneralAdmission ? currentStep + 1 : currentStep;
  const totalSteps = isGeneralAdmission ? 3 : 4;

  useEffect(() => {
    if (show && open) {
      setShow(show.id, show.venue, show.date, show.city);
      // For GA venues, auto-set section to general admission
      if (isGeneralAdmission) {
        useTicketCartStore.getState().setSection({
          sectionId: 'ga',
          sectionName: 'General Admission',
          priceModifier: 1,
        });
      }
    }
  }, [show, open, setShow, isGeneralAdmission]);

  const handleClose = () => {
    resetCart();
    onOpenChange(false);
  };

  if (!show) return null;

  const stepLabels = isGeneralAdmission ? GA_STEP_LABELS : RESERVED_STEP_LABELS;
  const displayStepsCount = isGeneralAdmission ? 3 : 4;
  

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl md:max-w-4xl lg:max-w-5xl max-h-[90vh] overflow-y-auto bg-background border-border">
        <DialogHeader>
          <DialogTitle className="text-center">
            {!orderConfirmed ? (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground font-normal">
                  {show.venue}
                </p>
                
                {/* Step Indicator */}
                <div className="flex items-center justify-center gap-2">
                  {stepLabels.slice(0, displayStepsCount).map((label, idx) => {
                    const stepNum = idx + 1;
                    // For GA, currentStep 1 = Tickets (first step), for Reserved currentStep 1 = Section
                    const effectiveCurrentStep = isGeneralAdmission ? currentStep : currentStep;
                    const isActive = effectiveCurrentStep === stepNum;
                    const isComplete = effectiveCurrentStep > stepNum;
                    
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
                        {idx < displayStepsCount - 1 && (
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
                  Step {currentStep} of {displayStepsCount}: {stepLabels[currentStep - 1]}
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
          {/* For Reserved: Step 1 is SeatSelection, For GA: skip this */}
          {!orderConfirmed && !isGeneralAdmission && currentStep === 1 && (
            <SeatSelection
              showId={show.id}
              onNext={nextStep}
              onBack={() => {}}
            />
          )}
          
          {/* For Reserved: Step 2, For GA: Step 1 */}
          {!orderConfirmed && (isGeneralAdmission ? currentStep === 1 : currentStep === 2) && (
            <TicketTypeSelection
              showId={show.id}
              onNext={nextStep}
              onBack={isGeneralAdmission ? () => {} : prevStep}
            />
          )}
          
          {/* For Reserved: Step 3, For GA: Step 2 */}
          {!orderConfirmed && (isGeneralAdmission ? currentStep === 2 : currentStep === 3) && (
            <MerchBundleUpsell
              onNext={nextStep}
              onBack={prevStep}
            />
          )}
          
          {/* For Reserved: Step 4, For GA: Step 3 */}
          {!orderConfirmed && (isGeneralAdmission ? currentStep === 3 : currentStep === 4) && (
            <CartReview
              onNext={nextStep}
              onBack={prevStep}
            />
          )}
          
          {/* Confirmation - shown when orderConfirmed is true */}
          {orderConfirmed && (
            <TicketConfirmation
              onClose={handleClose}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
