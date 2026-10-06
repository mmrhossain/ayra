


export interface Slider {
    link: string;
    imageUrl: string;
    mobileImageUrl?: string;
    title?: string;
}

export interface SliderState {
    sliders: Slider[] | null;
    getSliders: () => Promise<void>;
}