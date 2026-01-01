import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { ArrowRight, Sparkles, Zap, Palette, Code2, Share2, Layers } from "lucide-react";
import { getLoginUrl } from "@/const";

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();

  const handleGetStarted = () => {
    if (isAuthenticated) {
      navigate("/dashboard");
    } else {
      window.location.href = getLoginUrl();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-slate-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                BuilderAI
              </span>
            </div>
            <div className="flex items-center gap-4">
              {isAuthenticated ? (
                <>
                  <span className="text-sm text-slate-600">Welcome, {user?.name}</span>
                  <Button onClick={() => navigate("/dashboard")} variant="default">
                    Dashboard
                  </Button>
                </>
              ) : (
                <Button onClick={handleGetStarted} variant="default">
                  Get Started
                </Button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-full border border-blue-200 mb-8">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-600">AI-Powered Website Generation</span>
          </div>

          <h1 className="text-5xl sm:text-6xl font-bold text-slate-900 mb-6 leading-tight">
            Create Beautiful Websites with{" "}
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              AI Magic
            </span>
          </h1>

          <p className="text-xl text-slate-600 mb-8 max-w-2xl mx-auto">
            Transform your ideas into stunning, professional websites in minutes. Generate, customize, and export to your favorite design tools—all powered by advanced AI.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button onClick={handleGetStarted} size="lg" className="gap-2">
              Start Building Now <ArrowRight className="w-5 h-5" />
            </Button>
            <Button variant="outline" size="lg">
              View Demo
            </Button>
          </div>

          {/* Feature Preview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">
            <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">AI Generation</h3>
              <p className="text-slate-600">Describe your vision and watch AI create a complete website design instantly.</p>
            </div>

            <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <Palette className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Full Customization</h3>
              <p className="text-slate-600">Fine-tune colors, typography, spacing, and layout with an intuitive visual editor.</p>
            </div>

            <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <Share2 className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Export Anywhere</h3>
              <p className="text-slate-600">Export to Framer, Figma, Webflow, or HTML with a single click.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white border-t border-slate-200">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">Powerful Features</h2>
            <p className="text-lg text-slate-600">Everything you need to create professional websites</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {/* Feature 1 */}
            <div className="flex gap-6">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-50 rounded-lg flex items-center justify-center">
                  <Code2 className="w-6 h-6 text-blue-600" />
                </div>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-slate-900 mb-2">Visual Editor</h3>
                <p className="text-slate-600">Drag-and-drop interface for intuitive design customization. No coding required.</p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="flex gap-6">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-purple-50 rounded-lg flex items-center justify-center">
                  <Layers className="w-6 h-6 text-purple-600" />
                </div>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-slate-900 mb-2">Template Library</h3>
                <p className="text-slate-600">Choose from professionally designed templates and pre-built sections.</p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="flex gap-6">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-green-50 rounded-lg flex items-center justify-center">
                  <Share2 className="w-6 h-6 text-green-600" />
                </div>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-slate-900 mb-2">Multi-Platform Export</h3>
                <p className="text-slate-600">Export to Framer, Figma, Webflow, or HTML with design tokens included.</p>
              </div>
            </div>

            {/* Feature 4 */}
            <div className="flex gap-6">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-gradient-to-br from-amber-100 to-amber-50 rounded-lg flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-amber-600" />
                </div>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-slate-900 mb-2">AI Image Generation</h3>
                <p className="text-slate-600">Generate custom graphics and images for your designs using AI.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-12 text-center text-white">
          <h2 className="text-4xl font-bold mb-4">Ready to Build?</h2>
          <p className="text-lg text-blue-100 mb-8">
            Start creating beautiful websites today. No credit card required.
          </p>
          <Button onClick={handleGetStarted} size="lg" variant="secondary">
            Get Started Free <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 py-8 px-4 sm:px-6 lg:px-8 bg-slate-50">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="font-semibold text-slate-900">BuilderAI</span>
            </div>
            <p className="text-sm text-slate-600">© 2024 BuilderAI. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
