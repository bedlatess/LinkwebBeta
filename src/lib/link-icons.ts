import {
  AtSign,
  BadgeDollarSign,
  BookOpen,
  Calendar,
  Camera,
  Code2,
  Disc3,
  ExternalLink,
  Gamepad2,
  Globe,
  Headphones,
  Link2,
  Mail,
  MessageCircle,
  Music2,
  Newspaper,
  PenLine,
  Play,
  Radio,
  Rss,
  Send,
  ShoppingBag,
  Video,
  type LucideIcon,
} from "lucide-react";

export type LinkIconOption = {
  value: string;
  label: string;
  aliases: string[];
  icon: LucideIcon;
};

export const DEFAULT_LINK_ICON = "default";

export const LINK_ICON_OPTIONS: LinkIconOption[] = [
  {
    value: DEFAULT_LINK_ICON,
    label: "默认链接",
    aliases: ["link", "url"],
    icon: Link2,
  },
  {
    value: "website",
    label: "个人网站",
    aliases: ["site", "homepage", "portfolio"],
    icon: Globe,
  },
  {
    value: "github",
    label: "GitHub",
    aliases: ["git", "code"],
    icon: Code2,
  },
  {
    value: "twitter",
    label: "X / Twitter",
    aliases: ["x"],
    icon: MessageCircle,
  },
  {
    value: "instagram",
    label: "Instagram",
    aliases: ["ig"],
    icon: Camera,
  },
  {
    value: "telegram",
    label: "Telegram",
    aliases: ["tg"],
    icon: Send,
  },
  {
    value: "discord",
    label: "Discord",
    aliases: ["community"],
    icon: MessageCircle,
  },
  {
    value: "linkedin",
    label: "LinkedIn",
    aliases: ["in"],
    icon: AtSign,
  },
  {
    value: "facebook",
    label: "Facebook",
    aliases: ["fb"],
    icon: MessageCircle,
  },
  {
    value: "email",
    label: "Email",
    aliases: ["mail"],
    icon: Mail,
  },
  {
    value: "youtube",
    label: "YouTube",
    aliases: ["yt"],
    icon: Play,
  },
  {
    value: "bilibili",
    label: "Bilibili",
    aliases: ["b站", "bili"],
    icon: Play,
  },
  {
    value: "douyin",
    label: "抖音",
    aliases: ["tiktok-cn"],
    icon: Video,
  },
  {
    value: "tiktok",
    label: "TikTok",
    aliases: ["shorts"],
    icon: Music2,
  },
  {
    value: "kuaishou",
    label: "快手",
    aliases: ["ks"],
    icon: Camera,
  },
  {
    value: "twitch",
    label: "Twitch",
    aliases: ["live"],
    icon: Radio,
  },
  {
    value: "podcast",
    label: "播客",
    aliases: ["fm"],
    icon: Radio,
  },
  {
    value: "spotify",
    label: "Spotify",
    aliases: ["music"],
    icon: Headphones,
  },
  {
    value: "soundcloud",
    label: "SoundCloud",
    aliases: ["audio"],
    icon: Disc3,
  },
  {
    value: "substack",
    label: "Substack",
    aliases: ["newsletter"],
    icon: Newspaper,
  },
  {
    value: "medium",
    label: "Medium",
    aliases: ["blog"],
    icon: BookOpen,
  },
  {
    value: "blog",
    label: "博客",
    aliases: ["article"],
    icon: PenLine,
  },
  {
    value: "shop",
    label: "商店",
    aliases: ["store", "taobao", "jd"],
    icon: ShoppingBag,
  },
  {
    value: "donate",
    label: "赞助",
    aliases: ["tip", "sponsor"],
    icon: BadgeDollarSign,
  },
  {
    value: "calendar",
    label: "日程预约",
    aliases: ["booking", "cal"],
    icon: Calendar,
  },
  {
    value: "game",
    label: "游戏/直播",
    aliases: ["steam", "gaming"],
    icon: Gamepad2,
  },
  {
    value: "rss",
    label: "RSS",
    aliases: ["feed"],
    icon: Rss,
  },
  {
    value: "contact",
    label: "联系我",
    aliases: ["wechat", "weixin", "qq", "whatsapp"],
    icon: AtSign,
  },
  {
    value: "external",
    label: "外部链接",
    aliases: ["external-link"],
    icon: ExternalLink,
  },
];

const ICON_LOOKUP = new Map<string, LinkIconOption>();

for (const option of LINK_ICON_OPTIONS) {
  ICON_LOOKUP.set(option.value, option);
  for (const alias of option.aliases) {
    ICON_LOOKUP.set(alias.toLowerCase(), option);
  }
}

export function getLinkIconOption(iconName?: string | null) {
  if (!iconName) return LINK_ICON_OPTIONS[0];
  return ICON_LOOKUP.get(iconName.toLowerCase()) ?? LINK_ICON_OPTIONS[0];
}

export function isValidLinkIcon(iconName?: string | null) {
  if (!iconName) return true;
  return ICON_LOOKUP.has(iconName.toLowerCase());
}
