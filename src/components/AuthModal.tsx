
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, Tab, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RecaptchaVerifier, signInWithPhoneNumber, PhoneAuthProvider, signInWithCredential } from "firebase/auth";
import { auth } from "@/config/firebase";
import { toast } from "sonner";
import { Phone, Shield, User } from "lucide-react";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const AuthModal = ({ isOpen, onClose, onSuccess }: AuthModalProps) => {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [verificationId, setVerificationId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<"phone" | "otp">("phone");

  const setupRecaptcha = () => {
    if (!(window as any).recaptchaVerifier) {
      (window as any).recaptchaVerifier = new RecaptchaVerifier(auth, "recaptcha-container", {
        size: "invisible",
        callback: () => {
          console.log("Recaptcha resolved");
        },
        "expired-callback": () => {
          console.log("Recaptcha expired");
        }
      });
    }
  };

  const sendOTP = async () => {
    if (!phoneNumber.trim()) {
      toast.error("Please enter a valid phone number");
      return;
    }

    setIsLoading(true);
    try {
      setupRecaptcha();
      const appVerifier = (window as any).recaptchaVerifier;
      const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
      setVerificationId(confirmationResult.verificationId);
      setStep("otp");
      toast.success("OTP sent successfully!");
    } catch (error: any) {
      console.error("Error sending OTP:", error);
      toast.error("Failed to send OTP. Please try again.");
      if ((window as any).recaptchaVerifier) {
        (window as any).recaptchaVerifier.clear();
        (window as any).recaptchaVerifier = null;
      }
    } finally {
      setIsLoading(false);
    }
  };

  const verifyOTP = async () => {
    if (!otp.trim()) {
      toast.error("Please enter the OTP");
      return;
    }

    setIsLoading(true);
    try {
      const credential = PhoneAuthProvider.credential(verificationId, otp);
      await signInWithCredential(auth, credential);
      toast.success("Login successful!");
      onSuccess();
      onClose();
      resetForm();
    } catch (error: any) {
      console.error("Error verifying OTP:", error);
      toast.error("Invalid OTP. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setPhoneNumber("");
    setOtp("");
    setVerificationId("");
    setStep("phone");
    if ((window as any).recaptchaVerifier) {
      (window as any).recaptchaVerifier.clear();
      (window as any).recaptchaVerifier = null;
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-blue-600" />
              Login to Your Account
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {step === "phone" ? (
              <div className="space-y-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <Phone className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                  <p className="text-sm text-gray-700">
                    Enter your phone number to receive a verification code
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    disabled={isLoading}
                  />
                  <p className="text-xs text-gray-500">
                    Include country code (e.g., +91 for India)
                  </p>
                </div>

                <Button
                  onClick={sendOTP}
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600"
                >
                  {isLoading ? "Sending..." : "Send OTP"}
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <Shield className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <p className="text-sm text-gray-700">
                    Enter the verification code sent to {phoneNumber}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="otp">Verification Code</Label>
                  <Input
                    id="otp"
                    type="text"
                    placeholder="Enter 6-digit code"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    disabled={isLoading}
                    maxLength={6}
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setStep("phone")}
                    disabled={isLoading}
                    className="flex-1"
                  >
                    Back
                  </Button>
                  <Button
                    onClick={verifyOTP}
                    disabled={isLoading}
                    className="flex-1 bg-gradient-to-r from-green-600 to-blue-600"
                  >
                    {isLoading ? "Verifying..." : "Verify"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
      <div id="recaptcha-container"></div>
    </>
  );
};

export default AuthModal;
