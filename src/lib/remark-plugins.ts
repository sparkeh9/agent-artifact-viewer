import { visit } from 'unist-util-visit';
import { Plugin } from 'unified';
import { Node } from 'unist';

export const remarkDirectiveRehype: Plugin = () => {
    return (tree: Node) => {
        visit(tree, (node: any) => {
            if (
                node.type === 'containerDirective' ||
                node.type === 'leafDirective' ||
                node.type === 'textDirective'
            ) {
                const data = node.data || (node.data = {});
                const tagName = node.type === 'textDirective' ? 'span' : 'div';

                // Add HAST properties for rehype/react-markdown to use
                data.hName = tagName;
                data.hProperties = {
                    ...(data.hProperties || {}),
                    'data-directive': node.name,
                    ...node.attributes,
                };
            }
        });
    };
};

export const remarkCarousel: Plugin = () => {
    return (tree: Node) => {
        visit(tree, (node: any) => {
            if (node.type === 'containerDirective' && node.name === 'carousel') {
                const children = node.children || [];
                const newChildren: any[] = [];
                let currentSlide: any[] = [];

                children.forEach((child: any) => {
                    // Check for <!-- slide --> comment
                    // In remark, HTML comments are nodes of type 'html'
                    if (child.type === 'html' && child.value.trim() === '<!-- slide -->') {
                        if (currentSlide.length > 0) {
                            newChildren.push({
                                type: 'containerDirective',
                                name: 'slide',
                                data: {
                                    hName: 'div',
                                    hProperties: {
                                        'data-carousel-slide': 'true',
                                        className: 'carousel-slide'
                                    }
                                },
                                children: currentSlide
                            });
                            currentSlide = [];
                        }
                    } else {
                        currentSlide.push(child);
                    }
                });

                // Push remaining slide
                if (currentSlide.length > 0) {
                    newChildren.push({
                        type: 'containerDirective',
                        name: 'slide',
                        data: {
                            hName: 'div',
                            hProperties: {
                                'data-carousel-slide': 'true',
                                className: 'carousel-slide'
                            }
                        },
                        children: currentSlide
                    });
                }

                // If there were separators, we replace children with grouped slides.
                // If no separators, we wrap everything in one slide (or just leave it, but wrapping ensures consistency)
                if (newChildren.length > 0) {
                    node.children = newChildren;
                }
            }
        });
    };
};
