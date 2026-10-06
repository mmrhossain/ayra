import {SocialLink} from "@/types/social";

export interface BlogPost {
    id: number;
    title: string;
    date: string;
    image: string;
}

export interface BlogDetails extends BlogPost {
    author: string;
    description: string;
    tags: string[];
    categories: string[];
    socialLinks: SocialLink[];
    relatedPosts: RelatedPost[];
    comments: Comment[];
}

export interface Comment {
    id: string;
    name: string;
    email: string;
    website?: string;
    text: string;
    replies?: Comment[];
}

export interface RelatedPost {
    id: string;
    title: string;
    date: string;
    images: string;
}

