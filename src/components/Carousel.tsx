import React, { useCallback } from 'react'
import useEmblaCarousel from 'embla-carousel-react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface CarouselProps {
    children: React.ReactNode
}

export const Carousel: React.FC<CarouselProps> = ({ children }) => {
    const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true })

    const scrollPrev = useCallback(() => {
        if (emblaApi) emblaApi.scrollPrev()
    }, [emblaApi])

    const scrollNext = useCallback(() => {
        if (emblaApi) emblaApi.scrollNext()
    }, [emblaApi])

    // Inspect children to see if they are grouped slides (from remarkCarousel)
    // or just a list of items (e.g. images)
    const childrenArray = React.Children.toArray(children);
    let slides: React.ReactNode[] = [];

    const groupedSlides = childrenArray.filter(
        (child) => React.isValidElement(child) && (child.props as any)['data-carousel-slide']
    );

    if (groupedSlides.length > 0) {
        slides = groupedSlides;
    } else {
        // Fallback: items that are direct children (e.g. images in a paragraph)
        slides = childrenArray.filter(child => React.isValidElement(child));
    }

    if (slides.length === 0) return null;

    return (
        <div className="relative group my-8">
            <div className="overflow-hidden rounded-xl border border-white/10 bg-black/40" ref={emblaRef}>
                <div className="flex">
                    {slides.map((slide, index) => (
                        <div className="flex-[0_0_100%] min-w-0 relative pl-4 first:pl-0 flex justify-center items-center p-8" key={index}>
                            {slide}
                        </div>
                    ))}
                </div>
            </div>

            <button
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-brand-cyan/20 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity border border-white/10 hover:border-brand-cyan/50 backdrop-blur-sm"
                onClick={scrollPrev}
            >
                <ChevronLeft className="w-6 h-6" />
            </button>
            <button
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-brand-cyan/20 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity border border-white/10 hover:border-brand-cyan/50 backdrop-blur-sm"
                onClick={scrollNext}
            >
                <ChevronRight className="w-6 h-6" />
            </button>
        </div>
    )
}
