import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  Users, Heart, Eye, Video, ExternalLink, Music2,
  CheckCircle2, Link as LinkIcon, AlertTriangle, Loader2,
  ChevronDown, MessageCircle, Share2, Clock
} from "lucide-react";
import { useTikTokData, type TikTokVideo, type TikTokScopeInfo } from "@/hooks/useTikTokData";
import { formatDistanceToNow } from "date-fns";
import { sv } from "date-fns/locale";

const ScopeMissing = ({ scope }: { scope: string }) => (
  <div className="flex items-center gap-2 text-xs text-warning bg-warning/10 rounded-lg px-3 py-1.5">
    <AlertTriangle className="w-3 h-3 shrink-0" />
    <span>Behover tillstand: <code className="font-mono">{scope}</code></span>
  </div>
);

const StatCard = ({ label, value, icon: Icon }: { label: string; value: string | number; icon: any }) => (
  <div className="p-3 rounded-lg bg-muted text-center">
    <Icon className="w-4 h-4 mx-auto mb-1.5 text-muted-foreground" />
    <p className="text-lg font-semibold text-foreground">{typeof value === 'number' ? value.toLocaleString('sv-SE') : value}</p>
    <p className="text-[11px] text-muted-foreground mt-0.5">{label}</p>
  </div>
);

const VideoCard = ({ video }: { video: TikTokVideo }) => {
  const timeAgo = video.created_at
    ? formatDistanceToNow(new Date(video.created_at), { addSuffix: true, locale: sv })
    : null;

  return (
    <div className="flex gap-3 p-3 rounded-lg bg-muted hover:bg-muted/80 transition-colors">
      {video.cover_image_url ? (
        <img src={video.cover_image_url} alt={video.title} className="w-20 h-28 rounded-lg object-cover shrink-0 bg-muted" loading="lazy" />
      ) : (
        <div className="w-20 h-28 rounded-lg bg-muted flex items-center justify-center shrink-0">
          <Video className="w-6 h-6 text-muted-foreground" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm text-foreground line-clamp-2 mb-1">{video.title}</p>
        {timeAgo && <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1"><Clock className="w-3 h-3" />{timeAgo}</p>}
        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{video.views.toLocaleString('sv-SE')}</span>
          <span className="flex items-center gap-1"><Heart className="w-3 h-3" />{video.likes.toLocaleString('sv-SE')}</span>
          <span className="flex items-center gap-1"><MessageCircle className="w-3 h-3" />{video.comments.toLocaleString('sv-SE')}</span>
          <span className="flex items-center gap-1"><Share2 className="w-3 h-3" />{video.shares.toLocaleString('sv-SE')}</span>
        </div>
        {video.share_url && (
          <a href={video.share_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-2">
            <ExternalLink className="w-3 h-3" /> Oppna pa TikTok
          </a>
        )}
      </div>
    </div>
  );
};

const TikTokProfileSection = () => {
  const { t } = useTranslation();
  const { user, stats, videos, pagination, scopeInfo, loading, loadingMore, error, limited_access, scope_message, refetch, loadMoreVideos } = useTikTokData();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl bg-card shadow-sm p-6 text-center">
        <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-destructive" />
        <p className="text-sm font-medium text-foreground mb-1">{t('toasts.could_not_fetch_tiktok')}</p>
        <p className="text-xs text-muted-foreground mb-3">{error.message}</p>
        <Button variant="outline" size="sm" onClick={refetch}>Forsok igen</Button>
      </div>
    );
  }

  if (!user) return null;

  const missingScopes = scopeInfo?.missing_scopes || [];
  const hasProfileScope = !missingScopes.includes('user.info.profile');
  const hasStatsScope = !missingScopes.includes('user.info.stats');
  const hasVideoScope = !missingScopes.includes('video.list');

  return (
    <div className="space-y-4">
      {/* Profile */}
      <div className="rounded-xl bg-card shadow-sm p-5">
        <div className="flex items-start gap-4">
          <Avatar className="w-14 h-14">
            <AvatarImage src={user.avatar_url} alt={user.display_name} />
            <AvatarFallback className="bg-muted text-foreground text-lg">
              {user.display_name?.charAt(0) || '?'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-semibold text-foreground">{user.display_name}</h2>
              {user.is_verified && (
                <Badge variant="secondary" className="text-xs">
                  <CheckCircle2 className="w-3 h-3 mr-1" /> Verifierad
                </Badge>
              )}
            </div>
            {user.open_id && <p className="text-[10px] text-muted-foreground font-mono mt-0.5">ID: {user.open_id}</p>}
            {hasProfileScope ? (
              user.bio_description ? (
                <p className="text-sm text-muted-foreground mt-1.5 line-clamp-3">{user.bio_description}</p>
              ) : (
                <p className="text-sm text-muted-foreground mt-1.5 italic">Ingen bio</p>
              )
            ) : (
              <div className="mt-1.5"><ScopeMissing scope="user.info.profile" /></div>
            )}
            <div className="flex flex-wrap gap-2 mt-2">
              {hasProfileScope ? (
                <>
                  {user.profile_web_link && (
                    <a href={user.profile_web_link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-primary hover:underline bg-muted rounded-full px-3 py-1">
                      <LinkIcon className="w-3 h-3" /> Profil (webb)
                    </a>
                  )}
                  {user.profile_deep_link && (
                    <a href={user.profile_deep_link} className="inline-flex items-center gap-1 text-xs text-primary hover:underline bg-muted rounded-full px-3 py-1">
                      <Music2 className="w-3 h-3" /> Oppna i TikTok
                    </a>
                  )}
                </>
              ) : (
                <ScopeMissing scope="user.info.profile" />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      {hasStatsScope && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard label="Foljare" value={user.follower_count || 0} icon={Users} />
          <StatCard label="Foljer" value={user.following_count || 0} icon={Users} />
          <StatCard label="Totala likes" value={user.likes_count || 0} icon={Heart} />
          <StatCard label="Antal videor" value={user.video_count || 0} icon={Video} />
        </div>
      )}
      {!hasStatsScope && <ScopeMissing scope="user.info.stats" />}

      {hasVideoScope && stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard label="Video-visningar" value={stats.totalViews} icon={Eye} />
          <StatCard label="Video-likes" value={stats.totalLikes} icon={Heart} />
          <StatCard label="Kommentarer" value={stats.totalComments} icon={MessageCircle} />
          <StatCard label="Engagemang" value={stats.avgEngagementRate} icon={Share2} />
        </div>
      )}

      {/* Limited access */}
      {limited_access && scope_message && (
        <div className="rounded-xl bg-warning/5 border border-warning/20 p-4 flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 text-warning shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-foreground">Begransad atkomst</p>
            <p className="text-xs text-muted-foreground mt-0.5">{scope_message}</p>
          </div>
        </div>
      )}

      {/* Videos */}
      <div className="rounded-xl bg-card shadow-sm p-5">
        <div className="flex items-center gap-2 mb-3">
          <h3 className="text-sm font-medium text-foreground">Videor</h3>
          {videos.length > 0 && <Badge variant="secondary" className="text-xs">{videos.length}</Badge>}
        </div>
        {hasVideoScope ? (
          videos.length > 0 ? (
            <div className="space-y-2">
              {videos.map((video) => <VideoCard key={video.id} video={video} />)}
              {pagination?.has_more && (
                <div className="text-center pt-2">
                  <Button variant="outline" size="sm" onClick={loadMoreVideos} disabled={loadingMore}>
                    {loadingMore ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ChevronDown className="w-4 h-4 mr-2" />}
                    Ladda fler videor
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-sm text-muted-foreground">{t('common.no_public_videos')}</p>
            </div>
          )
        ) : (
          <div className="text-center py-4"><ScopeMissing scope="video.list" /></div>
        )}
      </div>
    </div>
  );
};

export default TikTokProfileSection;
