export type MediaActivity = {
  id: string;
  platform: string;
  title: string;
  content: string;
  status: string;
  icon: string;
};

export const getMediaActivities = (): MediaActivity[] => [
  {
    id: "steam-1",
    platform: "Steam",
    title: "Currently Playing",
    content: "Hollow Knight",
    status: "112% Completion Route",
    icon: "sports_esports"
  },
  {
    id: "yt-1",
    platform: "YouTube",
    title: "Continue Watching",
    content: "Digital Architecture Essay",
    status: "14:22 Remaining",
    icon: "smart_display"
  },
  {
    id: "spotify-1",
    platform: "Spotify",
    title: "Ambient Flow",
    content: "Brian Eno - Music for Airports",
    status: "PLAYING",
    icon: "headphones"
  },
  {
    id: "read-1",
    platform: "Kindle",
    title: "Reading",
    content: "The Design of Everyday Things",
    status: "Chapter 4",
    icon: "menu_book"
  }
];
