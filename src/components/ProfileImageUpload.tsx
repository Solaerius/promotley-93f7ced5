import { useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ProfileImageUploadProps {
  userId: string;
  currentUrl?: string | null;
  type: "avatar" | "company_logo";
  onUploadComplete: (url: string) => void;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export const ProfileImageUpload = ({
  userId,
  currentUrl,
  type,
  onUploadComplete,
  size = "md",
  className,
}: ProfileImageUploadProps) => {
  const { t } = useTranslation();
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sizeClasses = {
    sm: "h-10 w-10",
    md: "h-16 w-16",
    lg: "h-24 w-24",
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error(t('profile.only_images'));
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error(t('profile.max_5mb'));
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload to Supabase
    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${userId}/${type}_${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("profile-images")
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("profile-images")
        .getPublicUrl(fileName);

      const publicUrl = urlData.publicUrl;

      // Update user profile
      const column = type === "avatar" ? "avatar_url" : "company_logo_url";
      const { error: updateError } = await supabase
        .from("users")
        .update({ [column]: publicUrl })
        .eq("id", userId);

      if (updateError) throw updateError;

      onUploadComplete(publicUrl);
      toast.success(type === "avatar" ? t('profile.avatar_updated') : t('profile.logo_updated'));
    } catch (error) {
      console.error("Upload error:", error);
      toast.error(t('profile.upload_error'));
      setPreviewUrl(null);
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async () => {
    setUploading(true);
    try {
      const column = type === "avatar" ? "avatar_url" : "company_logo_url";
      const { error } = await supabase
        .from("users")
        .update({ [column]: null })
        .eq("id", userId);

      if (error) throw error;

      setPreviewUrl(null);
      onUploadComplete("");
      toast.success(t('profile.image_deleted'));
    } catch (error) {
      console.error("Remove error:", error);
      toast.error(t('profile.delete_error'));
    } finally {
      setUploading(false);
    }
  };

  const displayUrl = previewUrl || currentUrl;

  return (
    <div className={cn("flex flex-col items-center gap-3", className)}>
      <div className="relative group">
        <Avatar className={cn(sizeClasses[size], "border-2 border-border")}>
          <AvatarImage src={displayUrl || undefined} />
          <AvatarFallback className="bg-muted">
            {type === "avatar" ? "U" : "C"}
          </AvatarFallback>
        </Avatar>
        
        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
            <Loader2 className="h-5 w-5 animate-spin text-white" />
          </div>
        )}
        
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
        >
          <Camera className="h-5 w-5 text-white" />
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? (
            <Loader2 className="h-4 w-4 animate-spin mr-1" />
          ) : (
            <Camera className="h-4 w-4 mr-1" />
          )}
          {type === "avatar" ? t('profile.change_avatar') : t('profile.change_logo')}
        </Button>
        
        {displayUrl && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRemove}
            disabled={uploading}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
};
