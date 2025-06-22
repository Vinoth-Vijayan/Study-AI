
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { signInWithPhoneNumber, RecaptchaVerifier, ConfirmationResult } from "firebase/auth";
import { auth } from "@/config/firebase";

// Extend Window interface to include recaptchaVerifier
declare global {
  interface Window {
    recaptchaVerifier: RecaptchaVerifier;
  }
}

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const AuthModal = ({ isOpen, onClose, onSuccess }: AuthModalProps) => {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);

  const setupRecaptcha = () => {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible',
        callback: () => {
          // reCAPTCHA solved
        }
      });
    }
  };

  const sendOtp = async () => {
    if (!phoneNumber.trim()) {
      toast.error("Please enter a valid phone number");
      return;
    }

    setIsLoading(true);
    try {
      setupRecaptcha();
      const formattedPhone = phoneNumber.startsWith('+91') ? phoneNumber : `+91${phoneNumber}`;
      const confirmation = await signInWithPhoneNumber(auth, formattedPhone, window.recaptchaVerifier);
      setConfirmationResult(confirmation);
      toast.success("OTP sent successfully!");
    } catch (error: any) {
      console.error("OTP sending error:", error);
      toast.error(error.message || "Failed to send OTP");
    } finally {
      setIsLoading(false);
    }
  };

  const verifyOtp = async () => {
    if (!otp.trim() || !confirmationResult) {
      toast.error("Please enter the OTP");
      return;
    }

    setIsLoading(true);
    try {
      await confirmationResult.confirm(otp);
      toast.success("Phone number verified successfully!");
      onSuccess();
      onClose();
      resetForm();
    } catch (error: any) {
      console.error("OTP verification error:", error);
      toast.error("Invalid OTP. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setPhoneNumber("");
    setOtp("");
    setConfirmationResult(null);
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
            <DialogTitle className="text-2xl font-bold text-center">
              Welcome to TNPSC Study AI
            </DialogTitle>
            <DialogDescription className="text-center">
              Sign in with your phone number to save your progress
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-1">
              <TabsTrigger value="login">Phone Login</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login" className="space-y-4">
              {!confirmationResult ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="Enter your phone number"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="w-full"
                    />
                    <p className="text-xs text-gray-500">
                      Format: 9876543210 or +919876543210
                    </p>
                  </div>
                  
                  <Button
                    onClick={sendOtp}
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600"
                  >
                    {isLoading ? "Sending OTP..." : "Send OTP"}
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="otp">Enter OTP</Label>
                    <Input
                      id="otp"
                      type="text"
                      placeholder="Enter 6-digit OTP"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      maxLength={6}
                      className="w-full text-center text-lg"
                    />
                    <p className="text-xs text-gray-500 text-center">
                      OTP sent to {phoneNumber}
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Button
                      onClick={verifyOtp}
                      disabled={isLoading}
                      className="w-full bg-gradient-to-r from-green-600 to-blue-600"
                    >
                      {isLoading ? "Verifying..." : "Verify OTP"}
                    </Button>
                    
                    <Button
                      onClick={() => setConfirmationResult(null)}
                      variant="outline"
                      className="w-full"
                    >
                      Change Phone Number
                    </Button>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
      
      <div id="recaptcha-container"></div>
    </>
  );
};

export default AuthModal;
