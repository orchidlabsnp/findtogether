import { Facebook, Share2, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiX, SiLinkedin, SiTiktok } from "react-icons/si";
import { useToast } from "@/hooks/use-toast";

interface ShareButtonsProps {
  url: string;
  title: string;
}

export default function ShareButtons({ url, title }: ShareButtonsProps) {
  const { toast } = useToast();
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      toast({
        title: "Link copied",
        description: "The case URL has been copied to your clipboard",
      });
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Please try copying the URL manually",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="flex items-center gap-2">
        <Share2 className="h-5 w-5 text-muted-foreground" />
        <span className="text-sm font-medium">Share this case</span>
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`, '_blank')}
        >
          <Facebook className="h-4 w-4" />
          Facebook
        </Button>

        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={() => window.open(`https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`, '_blank')}
        >
          <SiX className="h-4 w-4" />
          X (Twitter)
        </Button>

        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={() => window.open(`https://www.linkedin.com/shareArticle?mini=true&url=${encodedUrl}&title=${encodedTitle}`, '_blank')}
        >
          <SiLinkedin className="h-4 w-4" />
          LinkedIn
        </Button>

        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={() => window.open(`https://www.tiktok.com/share?url=${encodedUrl}`, '_blank')}
        >
          <SiTiktok className="h-4 w-4" />
          TikTok
        </Button>

        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={handleCopyLink}
        >
          <Link2 className="h-4 w-4" />
          Copy Link
        </Button>
      </div>
    </div>
  );
}