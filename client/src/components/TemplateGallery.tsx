import { useState } from "react";
import { Eye, Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Template {
  id: string;
  name: string;
  category: string;
  description: string;
  preview: string;
  thumbnail: string;
  sections: Array<{
    type: string;
    title: string;
    content: string;
  }>;
  designTokens: {
    colors: Record<string, string>;
    typography: Record<string, string>;
    spacing: Record<string, string>;
  };
}

interface TemplateGalleryProps {
  onTemplateSelect?: (template: Template) => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const TEMPLATE_CATEGORIES = [
  "All",
  "SaaS",
  "Portfolio",
  "E-Commerce",
  "Agency",
  "Blog",
  "Startup",
];

const FEATURED_TEMPLATES: Template[] = [
  {
    id: "saas-1",
    name: "Modern SaaS",
    category: "SaaS",
    description: "Clean and modern SaaS landing page with hero, features, pricing, and CTA",
    preview: "https://images.unsplash.com/photo-1460925895917-adf4e565db18?w=800",
    thumbnail: "https://images.unsplash.com/photo-1460925895917-adf4e565db18?w=200",
    sections: [
      {
        type: "hero",
        title: "Welcome to Our SaaS",
        content: "Build faster, ship smarter with our modern platform",
      },
      {
        type: "features",
        title: "Powerful Features",
        content: "Everything you need to succeed",
      },
      {
        type: "pricing",
        title: "Simple Pricing",
        content: "Choose the plan that fits your needs",
      },
      {
        type: "cta",
        title: "Get Started Today",
        content: "Join thousands of happy customers",
      },
    ],
    designTokens: {
      colors: {
        primary: "#3B82F6",
        secondary: "#10B981",
        accent: "#F59E0B",
      },
      typography: {
        fontFamily: "Inter, sans-serif",
        headingSize: "2.5rem",
      },
      spacing: {
        sm: "1rem",
        md: "2rem",
      },
    },
  },
  {
    id: "portfolio-1",
    name: "Creative Portfolio",
    category: "Portfolio",
    description: "Showcase your work with this elegant portfolio template",
    preview: "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800",
    thumbnail: "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=200",
    sections: [
      {
        type: "hero",
        title: "Creative Designer",
        content: "Crafting beautiful digital experiences",
      },
      {
        type: "features",
        title: "My Work",
        content: "Selected projects and case studies",
      },
      {
        type: "testimonials",
        title: "Client Testimonials",
        content: "What clients say about working with me",
      },
      {
        type: "cta",
        title: "Let's Work Together",
        content: "Get in touch for your next project",
      },
    ],
    designTokens: {
      colors: {
        primary: "#8B5CF6",
        secondary: "#EC4899",
        accent: "#F59E0B",
      },
      typography: {
        fontFamily: "Poppins, sans-serif",
        headingSize: "3rem",
      },
      spacing: {
        sm: "1.5rem",
        md: "2.5rem",
      },
    },
  },
  {
    id: "ecommerce-1",
    name: "E-Commerce Store",
    category: "E-Commerce",
    description: "Professional e-commerce template with product showcase",
    preview: "https://images.unsplash.com/photo-1557821552-17105176677c?w=800",
    thumbnail: "https://images.unsplash.com/photo-1557821552-17105176677c?w=200",
    sections: [
      {
        type: "hero",
        title: "Premium Products",
        content: "Discover our latest collection",
      },
      {
        type: "features",
        title: "Featured Items",
        content: "Best sellers and new arrivals",
      },
      {
        type: "pricing",
        title: "Shop Now",
        content: "Browse our complete catalog",
      },
      {
        type: "cta",
        title: "Start Shopping",
        content: "Find exactly what you need",
      },
    ],
    designTokens: {
      colors: {
        primary: "#DC2626",
        secondary: "#1F2937",
        accent: "#FBBF24",
      },
      typography: {
        fontFamily: "Roboto, sans-serif",
        headingSize: "2.25rem",
      },
      spacing: {
        sm: "1rem",
        md: "2rem",
      },
    },
  },
  {
    id: "agency-1",
    name: "Digital Agency",
    category: "Agency",
    description: "Professional agency template with services and portfolio",
    preview: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=800",
    thumbnail: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=200",
    sections: [
      {
        type: "hero",
        title: "Digital Agency",
        content: "We create exceptional digital experiences",
      },
      {
        type: "features",
        title: "Our Services",
        content: "Web design, development, and strategy",
      },
      {
        type: "testimonials",
        title: "Success Stories",
        content: "See what our clients achieved",
      },
      {
        type: "cta",
        title: "Start Your Project",
        content: "Let's build something amazing together",
      },
    ],
    designTokens: {
      colors: {
        primary: "#1F2937",
        secondary: "#3B82F6",
        accent: "#10B981",
      },
      typography: {
        fontFamily: "Montserrat, sans-serif",
        headingSize: "2.75rem",
      },
      spacing: {
        sm: "1.25rem",
        md: "2.25rem",
      },
    },
  },
  {
    id: "startup-1",
    name: "Startup Launch",
    category: "Startup",
    description: "Perfect for launching your new startup",
    preview: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=800",
    thumbnail: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=200",
    sections: [
      {
        type: "hero",
        title: "Your Startup Here",
        content: "Launch your idea to the world",
      },
      {
        type: "features",
        title: "Why Choose Us",
        content: "Key benefits and features",
      },
      {
        type: "pricing",
        title: "Pricing Plans",
        content: "Flexible options for every stage",
      },
      {
        type: "cta",
        title: "Join the Revolution",
        content: "Be part of our growing community",
      },
    ],
    designTokens: {
      colors: {
        primary: "#7C3AED",
        secondary: "#EC4899",
        accent: "#06B6D4",
      },
      typography: {
        fontFamily: "Space Grotesk, sans-serif",
        headingSize: "2.5rem",
      },
      spacing: {
        sm: "1rem",
        md: "2rem",
      },
    },
  },
];

export function TemplateGallery({
  onTemplateSelect,
  open = false,
  onOpenChange,
}: TemplateGalleryProps) {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);

  const filteredTemplates =
    selectedCategory === "All"
      ? FEATURED_TEMPLATES
      : FEATURED_TEMPLATES.filter((t) => t.category === selectedCategory);

  const handleSelectTemplate = (template: Template) => {
    if (onTemplateSelect) {
      onTemplateSelect(template);
      onOpenChange?.(false);
      toast.success(`Template "${template.name}" loaded`);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Template Gallery</DialogTitle>
          <DialogDescription>
            Choose from our collection of professionally designed templates
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Category Filter */}
          <div>
            <label className="text-sm font-medium text-slate-900 mb-3 block">
              Category
            </label>
            <div className="flex flex-wrap gap-2">
              {TEMPLATE_CATEGORIES.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    selectedCategory === category
                      ? "bg-blue-600 text-white"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          {/* Template Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTemplates.map((template) => (
              <div
                key={template.id}
                className="rounded-lg border border-slate-200 overflow-hidden hover:shadow-lg transition-shadow"
              >
                {/* Thumbnail */}
                <div className="relative h-40 bg-slate-100 overflow-hidden">
                  <img
                    src={template.thumbnail}
                    alt={template.name}
                    className="w-full h-full object-cover hover:scale-105 transition-transform"
                  />
                </div>

                {/* Content */}
                <div className="p-4 space-y-3">
                  <div>
                    <h3 className="font-semibold text-slate-900">{template.name}</h3>
                    <p className="text-xs text-slate-500 mt-1">{template.category}</p>
                  </div>

                  <p className="text-sm text-slate-600">{template.description}</p>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPreviewTemplate(template)}
                      className="flex-1 gap-2"
                    >
                      <Eye className="w-4 h-4" />
                      Preview
                    </Button>

                    <Button
                      size="sm"
                      onClick={() => handleSelectTemplate(template)}
                      className="flex-1"
                    >
                      Use Template
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Preview Dialog */}
        {previewTemplate && (
          <Dialog open={!!previewTemplate} onOpenChange={() => setPreviewTemplate(null)}>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>{previewTemplate.name}</DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                {/* Preview Image */}
                <div className="rounded-lg overflow-hidden bg-slate-100">
                  <img
                    src={previewTemplate.preview}
                    alt={previewTemplate.name}
                    className="w-full h-auto"
                  />
                </div>

                {/* Template Details */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold text-sm text-slate-900 mb-2">
                      Sections Included
                    </h4>
                    <ul className="space-y-1">
                      {previewTemplate.sections.map((section, idx) => (
                        <li key={idx} className="text-sm text-slate-600">
                          • {section.type.charAt(0).toUpperCase() + section.type.slice(1)}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold text-sm text-slate-900 mb-2">
                      Color Scheme
                    </h4>
                    <div className="flex gap-2">
                      {Object.values(previewTemplate.designTokens.colors).map(
                        (color, idx) => (
                          <div
                            key={idx}
                            className="w-8 h-8 rounded border border-slate-200"
                            style={{ backgroundColor: color }}
                            title={color}
                          />
                        )
                      )}
                    </div>
                  </div>
                </div>

                {/* Action */}
                <Button
                  onClick={() => {
                    handleSelectTemplate(previewTemplate);
                    setPreviewTemplate(null);
                  }}
                  className="w-full"
                >
                  Use This Template
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </DialogContent>
    </Dialog>
  );
}
