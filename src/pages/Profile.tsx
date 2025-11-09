import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Loader2, User, ShoppingBag, Shield, LogOut, CreditCard, ExternalLink, RefreshCw, Calendar as CalendarIcon, Trash2, AlertTriangle } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export default function Profile() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  
  // Profile fields
  const [displayName, setDisplayName] = useState("");
  const [location, setLocation] = useState("");
  const [bio, setBio] = useState("");
  const [realName, setRealName] = useState("");
  const [birthdate, setBirthdate] = useState("");
  const [gender, setGender] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState("");
  
  // Password change fields
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [showVerificationDialog, setShowVerificationDialog] = useState(false);
  const [verificationBirthdate, setVerificationBirthdate] = useState<Date | undefined>();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deletingAccount, setDeletingAccount] = useState(false);
  
  // Subscription state
  const [subscriptionData, setSubscriptionData] = useState<any>(null);
  const [loadingSubscription, setLoadingSubscription] = useState(false);
  const [loadingPortal, setLoadingPortal] = useState(false);

  useEffect(() => {
    checkUser();
    loadSubscriptionData();
    
    // Check if returning from successful subscription
    const params = new URLSearchParams(window.location.search);
    if (params.get('subscription') === 'success') {
      toast({
        title: "Success!",
        description: "Your subscription is now active. It may take a moment to update.",
      });
      // Refresh after a short delay to allow Stripe webhook to process
      setTimeout(() => {
        loadSubscriptionData();
      }, 2000);
    }
  }, []);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }
    
    setUser(user);
    loadProfile(user.id);
  };

  const loadProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (data) {
      setDisplayName(data.display_name || "");
      setLocation(data.location || "");
      setBio(data.bio || "");
      setRealName(data.real_name || "");
      setBirthdate(data.birthdate || "");
      setGender(data.gender || "");
      setAvatarUrl(data.avatar_url || "");
      setProfilePicturePreview(data.avatar_url || "");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          variant: "destructive",
          title: "File too large",
          description: "Profile picture must be less than 10MB",
        });
        return;
      }
      
      setProfilePicture(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePicturePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;

    try {
      setLoading(true);

      let newAvatarUrl = avatarUrl;

      // Upload new profile picture if provided
      if (profilePicture) {
        const fileExt = profilePicture.name.split('.').pop();
        const timestamp = Date.now();
        const fileName = `${user.id}/avatar-${timestamp}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('profile-pictures')
          .upload(fileName, profilePicture, {
            cacheControl: '0',
            upsert: true
          });

        if (uploadError) {
          console.error('Error uploading profile picture:', uploadError);
          toast({
            variant: "destructive",
            title: "Upload failed",
            description: uploadError.message,
          });
        } else {
          const { data: { publicUrl } } = supabase.storage
            .from('profile-pictures')
            .getPublicUrl(fileName);
          newAvatarUrl = `${publicUrl}?t=${timestamp}`;
        }
      }

      const { error } = await supabase
        .from('user_profiles')
        .update({
          display_name: displayName,
          location,
          bio,
          avatar_url: newAvatarUrl,
          real_name: realName || null,
          birthdate: birthdate || null,
          gender: gender || null,
        })
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Profile updated successfully!",
      });
      
      setProfilePicture(null);
      setAvatarUrl(newAvatarUrl);
      setProfilePicturePreview(newAvatarUrl);
      
      // Reload profile to ensure it's fresh
      await loadProfile(user.id);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const handleVerifyBirthdate = () => {
    if (!verificationBirthdate) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter your date of birth.",
      });
      return;
    }

    if (!birthdate) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No date of birth found in your profile. Please add it in the Profile tab first.",
      });
      setShowVerificationDialog(false);
      return;
    }

    const verificationDate = format(verificationBirthdate, "yyyy-MM-dd");
    
    if (verificationDate !== birthdate) {
      toast({
        variant: "destructive",
        title: "Verification Failed",
        description: "The date of birth you entered does not match our records.",
      });
      return;
    }

    // Verification successful
    setShowVerificationDialog(false);
    setShowPasswordSection(true);
    setVerificationBirthdate(undefined);
    
    toast({
      title: "Verified",
      description: "You can now change your password.",
    });
  };

  const handleChangePassword = async () => {
    if (!newPassword || !confirmPassword) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please fill in all password fields.",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Passwords do not match.",
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Password must be at least 6 characters long.",
      });
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Your password has been changed successfully.",
      });

      // Clear password fields and close section
      setNewPassword("");
      setConfirmPassword("");
      setShowPasswordSection(false);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const loadSubscriptionData = async () => {
    setLoadingSubscription(true);
    try {
      const { data, error } = await supabase.functions.invoke('check-subscription');
      
      if (error) {
        console.error('Error checking subscription:', error);
        return;
      }
      
      setSubscriptionData(data);
    } catch (error) {
      console.error('Error loading subscription:', error);
    } finally {
      setLoadingSubscription(false);
    }
  };

  const handleManageSubscription = async () => {
    setLoadingPortal(true);
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal');
      
      if (error) throw error;
      
      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to open subscription portal",
      });
    } finally {
      setLoadingPortal(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== "DELETE") {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please type DELETE to confirm account deletion.",
      });
      return;
    }

    try {
      setDeletingAccount(true);
      
      // Delete user data from user_profiles
      if (user) {
        await supabase
          .from('user_profiles')
          .delete()
          .eq('user_id', user.id);
      }
      
      // Delete the auth user account
      const { error } = await supabase.auth.admin.deleteUser(user.id);
      
      if (error) throw error;
      
      toast({
        title: "Account Deleted",
        description: "Your account has been permanently deleted.",
      });
      
      // Sign out and redirect
      await supabase.auth.signOut();
      navigate("/");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to delete account. Please contact support.",
      });
    } finally {
      setDeletingAccount(false);
      setShowDeleteDialog(false);
      setDeleteConfirmText("");
    }
  };

  return (
    <div className="min-h-screen bg-background pt-24 pb-12">
      <div className="container max-w-4xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">My Account</h1>
          <p className="text-muted-foreground">Manage your profile and account settings</p>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="profile" className="gap-2">
              <User className="w-4 h-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="subscription" className="gap-2">
              <CreditCard className="w-4 h-4" />
              Subscription
            </TabsTrigger>
            <TabsTrigger value="account" className="gap-2">
              <Shield className="w-4 h-4" />
              Account
            </TabsTrigger>
            <TabsTrigger value="orders" className="gap-2">
              <ShoppingBag className="w-4 h-4" />
              Orders
            </TabsTrigger>
            <TabsTrigger value="security" className="gap-2">
              <Shield className="w-4 h-4" />
              Security
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>Update your public and private profile information</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleUpdateProfile} className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Profile Picture</h3>
                    <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                      <div className="flex flex-col items-center">
                        {profilePicturePreview ? (
                          <img 
                            src={profilePicturePreview} 
                            alt="Preview" 
                            className="w-32 h-32 rounded-full object-cover border-4 border-primary"
                          />
                        ) : (
                          <div className="w-32 h-32 rounded-full bg-muted border-4 border-dashed border-primary/50 flex flex-col items-center justify-center">
                            <span className="text-5xl mb-1">📸</span>
                            <span className="text-xs text-muted-foreground">Your photo</span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 w-full space-y-3">
                        <div className="relative">
                          <label 
                            htmlFor="profilePictureInput" 
                            className="block w-full cursor-pointer"
                          >
                            <div className="bg-yellow-400 hover:bg-yellow-500 text-black font-semibold py-3 px-6 rounded-lg text-center transition-colors border-2 border-yellow-500">
                              Choose File
                            </div>
                          </label>
                          <input
                            id="profilePictureInput"
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            className="hidden"
                          />
                        </div>
                        {profilePicture && (
                          <p className="text-sm text-muted-foreground">
                            Selected: {profilePicture.name}
                          </p>
                        )}
                        <p className="text-sm text-muted-foreground">
                          👆 Click "Choose File" to upload your profile picture (max 10MB)
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 border-t pt-6">
                    <h3 className="text-lg font-semibold">Public Information</h3>
                    
                    <div>
                      <Label htmlFor="displayName">Display Name *</Label>
                      <Input
                        id="displayName"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="location">Location *</Label>
                      <Input
                        id="location"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="bio">Bio *</Label>
                      <Textarea
                        id="bio"
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        rows={3}
                        maxLength={200}
                        required
                      />
                      <p className="text-xs text-muted-foreground mt-1">{bio.length}/200</p>
                    </div>
                  </div>

                  <div className="space-y-4 border-t pt-6">
                    <h3 className="text-lg font-semibold">Private Information</h3>
                    
                    <div>
                      <Label htmlFor="realName">Real Name</Label>
                      <Input
                        id="realName"
                        value={realName}
                        onChange={(e) => setRealName(e.target.value)}
                      />
                    </div>

                    <div>
                      <Label htmlFor="birthdate">Date of Birth</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !birthdate && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4 text-primary" />
                            {birthdate ? format(new Date(birthdate), "PPP") : <span>Pick a date</span>}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={birthdate ? new Date(birthdate) : undefined}
                            onSelect={(date) => setBirthdate(date ? format(date, "yyyy-MM-dd") : "")}
                            disabled={(date) =>
                              date > new Date() || date < new Date("1900-01-01")
                            }
                            initialFocus
                            className="pointer-events-auto"
                            captionLayout="dropdown-buttons"
                            fromYear={1900}
                            toYear={new Date().getFullYear()}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div>
                      <Label htmlFor="gender">Gender</Label>
                      <Select value={gender} onValueChange={setGender}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                          <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Button type="submit" disabled={loading} className="w-full">
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Changes
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="subscription">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Subscription Status</CardTitle>
                      <CardDescription>Manage your membership and billing</CardDescription>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={loadSubscriptionData}
                      disabled={loadingSubscription}
                    >
                      {loadingSubscription ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <RefreshCw className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {loadingSubscription ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                  ) : subscriptionData?.subscribed ? (
                    <>
                      <div className="p-6 bg-primary/5 border-2 border-primary rounded-lg">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h3 className="text-xl font-bold">{subscriptionData.subscription.plan_name}</h3>
                            {subscriptionData.subscription.plan_description && (
                              <p className="text-sm text-muted-foreground mt-1">
                                {subscriptionData.subscription.plan_description}
                              </p>
                            )}
                          </div>
                          <Badge className="bg-primary">Active</Badge>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Amount</span>
                            <span className="font-semibold">
                              ${subscriptionData.subscription.amount}/{subscriptionData.subscription.interval}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Renews on</span>
                            <span className="font-semibold">
                              {new Date(subscriptionData.subscription.current_period_end).toLocaleDateString()}
                            </span>
                          </div>
                          {subscriptionData.subscription.cancel_at_period_end && (
                            <div className="flex justify-between">
                              <span className="text-destructive font-medium">Cancels on</span>
                              <span className="font-semibold text-destructive">
                                {new Date(subscriptionData.subscription.current_period_end).toLocaleDateString()}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <Button 
                        className="w-full" 
                        onClick={handleManageSubscription}
                        disabled={loadingPortal}
                      >
                        {loadingPortal ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <ExternalLink className="w-4 h-4 mr-2" />
                        )}
                        Manage Subscription & Payment
                      </Button>
                    </>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground mb-4">You don't have an active subscription</p>
                      <Button asChild>
                        <a href="/subscribe">View Plans</a>
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Payment Information</CardTitle>
                  <CardDescription>Manage your payment methods and billing</CardDescription>
                </CardHeader>
                <CardContent>
                  {loadingSubscription ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                  ) : subscriptionData?.payment_method ? (
                    <>
                      <div className="flex items-center gap-4 p-4 bg-muted/50 border-2 rounded-lg mb-4">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                          <CreditCard className="w-6 h-6 text-primary" />
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold capitalize text-lg">
                            {subscriptionData.payment_method.brand} •••• {subscriptionData.payment_method.last4}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Expires {subscriptionData.payment_method.exp_month}/{subscriptionData.payment_method.exp_year}
                          </p>
                        </div>
                      </div>
                      <Button 
                        className="w-full bg-gradient-gold hover:shadow-glow"
                        onClick={handleManageSubscription}
                        disabled={loadingPortal}
                      >
                        {loadingPortal ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <ExternalLink className="w-4 h-4 mr-2" />
                        )}
                        Update Payment Method
                      </Button>
                    </>
                  ) : (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
                        <CreditCard className="w-8 h-8 text-muted-foreground" />
                      </div>
                      <h3 className="font-semibold text-lg mb-2">No Payment Method</h3>
                      <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                        {subscriptionData?.subscribed 
                          ? "Add a payment method to ensure uninterrupted access to your subscription"
                          : "Subscribe to a membership plan and add your payment information"
                        }
                      </p>
                      {subscriptionData?.subscribed ? (
                        <Button 
                          className="bg-gradient-gold hover:shadow-glow"
                          onClick={handleManageSubscription}
                          disabled={loadingPortal}
                        >
                          {loadingPortal ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <>
                              <CreditCard className="w-4 h-4 mr-2" />
                              Add Payment Method
                            </>
                          )}
                        </Button>
                      ) : (
                        <Button asChild className="bg-gradient-gold hover:shadow-glow">
                          <a href="/subscribe">
                            View Subscription Plans
                          </a>
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="account">
            <Card>
              <CardHeader>
                <CardTitle>Account Settings</CardTitle>
                <CardDescription>Manage your account preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Email</Label>
                  <Input value={user?.email || ""} disabled />
                </div>
                <div>
                  <Label>Account Created</Label>
                  <Input value={user?.created_at ? new Date(user.created_at).toLocaleDateString() : ""} disabled />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="orders">
            <Card>
              <CardHeader>
                <CardTitle>Order History</CardTitle>
                <CardDescription>View your past orders and purchases</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-center py-8">No orders yet</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security">
            <Card>
              <CardHeader>
                <CardTitle>Security Settings</CardTitle>
                <CardDescription>Manage your password and security options</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {!showPasswordSection ? (
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      To change your password, you'll need to verify your identity first.
                    </p>
                    <Button 
                      className="w-full" 
                      onClick={() => setShowVerificationDialog(true)}
                    >
                      Change Password
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold">Change Your Password</h3>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => {
                          setShowPasswordSection(false);
                          setNewPassword("");
                          setConfirmPassword("");
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                    <div>
                      <Label htmlFor="new-password">New Password</Label>
                      <Input
                        id="new-password"
                        type="password"
                        placeholder="Enter new password (min 6 characters)"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="confirm-password">Confirm New Password</Label>
                      <Input
                        id="confirm-password"
                        type="password"
                        placeholder="Confirm new password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                      />
                    </div>
                    <Button 
                      className="w-full" 
                      onClick={handleChangePassword}
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Changing Password...
                        </>
                      ) : (
                        "Save New Password"
                      )}
                    </Button>
                  </div>
                )}
                
                <div className="border-t pt-6 space-y-4">
                  <Button 
                    variant="destructive" 
                    className="w-full gap-2"
                    onClick={handleLogout}
                  >
                    <LogOut className="w-4 h-4" />
                    Log Out
                  </Button>
                  
                  <div className="border-t pt-4">
                    <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 mb-4">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-destructive mt-0.5 flex-shrink-0" />
                        <div className="space-y-1">
                          <h4 className="font-semibold text-destructive">Danger Zone</h4>
                          <p className="text-sm text-muted-foreground">
                            Once you delete your account, there is no going back. This action cannot be undone.
                          </p>
                        </div>
                      </div>
                    </div>
                    <Button 
                      variant="destructive" 
                      className="w-full gap-2"
                      onClick={() => setShowDeleteDialog(true)}
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete Account Permanently
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Account Deletion Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="bg-background border-destructive">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              Delete Account Permanently?
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>This action <strong>cannot be undone</strong>. This will permanently delete:</p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Your profile and account data</li>
                <li>All your saved content and preferences</li>
                <li>Your purchase history</li>
                <li>Any active subscriptions</li>
              </ul>
              <div className="pt-4 space-y-2">
                <Label htmlFor="delete-confirm">Type <strong>DELETE</strong> to confirm:</Label>
                <Input
                  id="delete-confirm"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="Type DELETE here"
                  className="border-destructive focus-visible:ring-destructive"
                />
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteConfirmText("")}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAccount}
              disabled={deletingAccount || deleteConfirmText !== "DELETE"}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deletingAccount ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete My Account
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Birthdate Verification Dialog */}
      <Dialog open={showVerificationDialog} onOpenChange={setShowVerificationDialog}>
        <DialogContent className="sm:max-w-md bg-[#111] border-gray-800">
          <DialogHeader>
            <DialogTitle className="text-white">Verify Your Identity</DialogTitle>
            <DialogDescription className="text-gray-400">
              Please enter your date of birth to continue with changing your password.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <Label htmlFor="verify-birthdate" className="text-white">Date of Birth</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="verify-birthdate"
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal bg-[#1a1a1a] border-gray-700 text-white hover:bg-[#222] hover:border-primary",
                      !verificationBirthdate && "text-gray-400"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {verificationBirthdate ? format(verificationBirthdate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-[#111] border-gray-800" align="start">
                  <Calendar
                    mode="single"
                    selected={verificationBirthdate}
                    onSelect={setVerificationBirthdate}
                    captionLayout="dropdown-buttons"
                    fromYear={1940}
                    toYear={new Date().getFullYear()}
                    defaultMonth={verificationBirthdate}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => {
                  setShowVerificationDialog(false);
                  setVerificationBirthdate(undefined);
                }}
              >
                Cancel
              </Button>
              <Button 
                className="flex-1 bg-primary hover:bg-primary/90"
                onClick={handleVerifyBirthdate}
              >
                Verify
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
