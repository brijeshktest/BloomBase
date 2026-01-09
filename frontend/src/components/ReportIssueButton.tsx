'use client';

import { useState } from 'react';
import { AlertTriangle, X, Camera, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { issueApi } from '@/lib/api';
import toast from 'react-hot-toast';

export default function ReportIssueButton() {
  const { user, isAuthenticated } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    issueType: 'bug' as 'bug' | 'ui_issue' | 'feature_request' | 'other',
  });
  const [screenshot, setScreenshot] = useState<string | null>(null);

  // Don't show for admins or unauthenticated users
  if (!isAuthenticated || user?.role === 'admin') {
    return null;
  }

  const captureScreenshot = async (): Promise<string | null> => {
    try {
      // Try to use html2canvas if available
      let html2canvas;
      try {
        html2canvas = (await import('html2canvas')).default;
      } catch (e) {
        // html2canvas not installed, use fallback
        console.warn('html2canvas not available, using fallback method');
        return captureScreenshotFallback();
      }
      
      const canvasElement = await html2canvas(document.body, {
        useCORS: true,
        logging: false,
        scale: 0.5, // Reduce size for smaller file
        windowWidth: window.innerWidth,
        windowHeight: window.innerHeight,
        backgroundColor: '#ffffff',
      });

      return canvasElement.toDataURL('image/png', 0.7);
    } catch (error) {
      console.error('Error capturing screenshot:', error);
      // Fallback method
      return captureScreenshotFallback();
    }
  };

  const captureScreenshotFallback = (): string | null => {
    try {
      // Create a canvas and try to capture visible area
      // This is a basic fallback - limited functionality
      const canvas = document.createElement('canvas');
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) return null;

      // Fill with white background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Add text indicating this is a basic capture
      ctx.fillStyle = '#000000';
      ctx.font = '16px Arial';
      ctx.fillText('Screenshot capture limited - Page URL: ' + window.location.href, 10, 30);
      ctx.fillText('Please describe the issue in detail in the description field.', 10, 60);

      return canvas.toDataURL('image/png', 0.7);
    } catch (error) {
      console.error('Fallback screenshot failed:', error);
      return null;
    }
  };

  const handleOpen = async () => {
    setIsOpen(true);
    // Capture screenshot when modal opens
    try {
      const screenshotData = await captureScreenshot();
      if (screenshotData) {
        setScreenshot(screenshotData);
      } else {
        toast.error('Could not capture screenshot. You can still report the issue.');
      }
    } catch (error) {
      console.error('Screenshot capture failed:', error);
      toast.error('Screenshot capture failed. You can still report the issue.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.description.trim()) {
      toast.error('Please fill in title and description');
      return;
    }

    if (!screenshot) {
      toast.error('Screenshot is required. Please try again.');
      return;
    }

    setLoading(true);

    try {
      const browserInfo = {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        screenResolution: `${window.screen.width}x${window.screen.height}`,
        viewportSize: `${window.innerWidth}x${window.innerHeight}`,
      };

      await issueApi.reportIssue({
        title: formData.title.trim(),
        description: formData.description.trim(),
        pageUrl: window.location.href,
        screenshot: screenshot,
        browserInfo,
        issueType: formData.issueType,
      });

      toast.success('Issue reported successfully! We will look into it.');
      setIsOpen(false);
      setFormData({ title: '', description: '', issueType: 'bug' });
      setScreenshot(null);
    } catch (error: any) {
      console.error('Error reporting issue:', error);
      toast.error(error.response?.data?.message || 'Failed to report issue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={handleOpen}
        className="fixed bottom-24 right-6 z-50 bg-red-600 hover:bg-red-700 text-white rounded-full p-4 shadow-2xl hover:shadow-red-600/50 transition-all duration-300 hover:scale-110 group"
        aria-label="Report an issue"
        title="Report an issue"
      >
        <AlertTriangle className="w-6 h-6 relative z-10" />
        
        {/* Pulse animation */}
        <span className="absolute inset-0 rounded-full bg-red-600 animate-ping opacity-20"></span>
        
        {/* Tooltip */}
        <div className="absolute bottom-full right-0 mb-3 hidden group-hover:block bg-zinc-900 text-white text-sm rounded-lg px-4 py-2 whitespace-nowrap shadow-xl">
          Report an Issue
          <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-zinc-900"></div>
        </div>
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-zinc-200 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-zinc-900">Report an Issue</h2>
                  <p className="text-sm text-zinc-600">Help us improve by reporting problems</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsOpen(false);
                  setFormData({ title: '', description: '', issueType: 'bug' });
                  setScreenshot(null);
                }}
                className="text-zinc-400 hover:text-zinc-600 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Issue Type */}
              <div>
                <label className="form-label">Issue Type *</label>
                <select
                  value={formData.issueType}
                  onChange={(e) => setFormData({ ...formData, issueType: e.target.value as any })}
                  className="form-input"
                  required
                >
                  <option value="bug">Bug / Error</option>
                  <option value="ui_issue">UI / Design Issue</option>
                  <option value="feature_request">Feature Request</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {/* Title */}
              <div>
                <label className="form-label">Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="form-input"
                  placeholder="Brief description of the issue"
                  required
                  maxLength={100}
                />
              </div>

              {/* Description */}
              <div>
                <label className="form-label">Description *</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="form-input min-h-[120px] resize-none"
                  placeholder="Please describe the issue in detail. What were you trying to do? What happened instead?"
                  required
                  maxLength={1000}
                />
                <p className="text-xs text-zinc-500 mt-1">
                  {formData.description.length}/1000 characters
                </p>
              </div>

              {/* Screenshot Preview */}
              {screenshot && (
                <div>
                  <label className="form-label">Screenshot (Auto-captured)</label>
                  <div className="border border-zinc-200 rounded-lg p-4 bg-zinc-50">
                    <img
                      src={screenshot}
                      alt="Screenshot"
                      className="max-w-full h-auto rounded-lg border border-zinc-200"
                    />
                    <p className="text-xs text-zinc-500 mt-2">
                      Screenshot of current page captured automatically
                    </p>
                  </div>
                </div>
              )}

              {/* Page URL Info */}
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <p className="text-sm text-blue-900">
                  <strong>Page:</strong> {window.location.href}
                </p>
                <p className="text-xs text-blue-700 mt-1">
                  This information will help us locate and fix the issue faster.
                </p>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    setFormData({ title: '', description: '', issueType: 'bug' });
                    setScreenshot(null);
                  }}
                  className="flex-1 px-4 py-3 bg-zinc-100 text-zinc-700 rounded-xl font-semibold hover:bg-zinc-200 transition-colors"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !screenshot}
                  className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Camera className="w-5 h-5" />
                      Submit Report
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
