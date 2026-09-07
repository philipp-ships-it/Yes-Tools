import React, { useState, useEffect } from 'react';
import { 
  Mail, 
  Code2, 
  Eye, 
  Download, 
  Upload, 
  ShieldAlert, 
  Link as LinkIcon, 
  ExternalLink, 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  Smartphone, 
  Monitor, 
  Moon, 
  Sun, 
  Copy, 
  Wand2, 
  FileCode, 
  Layers, 
  Zap,
  FileCheck,
  ShieldCheck,
  Image as ImageIcon,
  Sliders,
  Sparkles,
  Check,
  Grid,
  RefreshCw
} from 'lucide-react';
import JSZip from 'jszip';
import { html as beautifyHtml } from 'js-beautify';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useToolTracking } from '../hooks/useToolTracking';
import { InvasiveChangeModal, InvasiveChangeItem } from '../components/InvasiveChangeModal';

// --- Preset Email Templates ---
const PRESET_TEMPLATES = {
  promo: `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="color-scheme" content="light dark" />
  <meta name="supported-color-schemes" content="light dark" />
  <title>Special Announcement</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:AllowPNG/>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style type="text/css">
    body { margin: 0; padding: 0; min-width: 100%; background-color: #f4f5f7; font-family: Arial, Helvetica, sans-serif; }
    table { border-collapse: collapse; }
    img { display: block; border: 0; outline: none; text-decoration: none; }
    @media only screen and (max-width: 600px) {
      .responsive-table { width: 100% !important; }
      .responsive-padding { padding: 20px 15px !important; }
      .mobile-center { text-align: center !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f5f7;">
  <!-- Preheader -->
  <div style="display: none; max-height: 0px; overflow: hidden;">
    Exclusive Offer Inside! Save up to 30% this week only.&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;
  </div>

  <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation" style="background-color: #f4f5f7;">
    <tr>
      <td align="center" style="padding: 20px 10px;">
        <!--[if mso]>
        <table align="center" border="0" cellspacing="0" cellpadding="0" width="600" role="presentation">
        <tr>
        <td align="center" valign="top" width="600">
        <![endif]-->
        <table border="0" cellpadding="0" cellspacing="0" width="100%" class="responsive-table" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);" role="presentation">
          <!-- Header Logo -->
          <tr>
            <td align="center" style="padding: 30px 20px; background-color: #111827;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: bold; letter-spacing: 1px;">YES NEWSLETTER</h1>
            </td>
          </tr>
          <!-- Hero Image -->
          <tr>
            <td align="center">
              <img src="https://images.unsplash.com/photo-1526738549149-8e07eca6c147?w=1200&auto=format&fit=crop&q=80" alt="Special Collection" width="600" style="width: 100%; max-width: 600px; height: auto;" border="0" />
            </td>
          </tr>
          <!-- Content Body -->
          <tr>
            <td class="responsive-padding" style="padding: 40px 30px; text-align: left; color: #374151;">
              <h2 style="font-size: 22px; color: #111827; margin-top: 0; margin-bottom: 16px;">Elevate Your Workflow with New Features</h2>
              <p style="font-size: 16px; line-height: 1.6; color: #4b5563; margin-bottom: 24px;">
                We are thrilled to present our latest updates designed specifically for email creators, designers, and marketers. Discover responsive layouts, bulletproof buttons, and clean MSO code.
              </p>
              <!-- Call to Action Button -->
              <table border="0" cellpadding="0" cellspacing="0" role="presentation" style="margin: 0 auto;">
                <tr>
                  <td align="center" bgcolor="#2563eb" style="border-radius: 8px;">
                    <a href="https://example.com/explore" target="_blank" style="display: inline-block; padding: 14px 32px; font-size: 16px; color: #ffffff; text-decoration: none; font-weight: bold; border-radius: 8px; background-color: #2563eb;">Explore Features Now</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding: 30px; background-color: #f9fafb; text-align: center; color: #9ca3af; font-size: 12px; line-height: 1.5; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 8px 0;">You received this email because you subscribed to YES Newsletter updates.</p>
              <p style="margin: 0;">
                <a href="*|UNSUB|*" style="color: #6b7280; text-decoration: underline;">Unsubscribe</a> | 
                <a href="https://example.com/privacy" style="color: #6b7280; text-decoration: underline;">Privacy Policy</a>
              </p>
            </td>
          </tr>
        </table>
        <!--[if mso]>
        </td>
        </tr>
        </table>
        <![endif]-->
      </td>
    </tr>
  </table>
</body>
</html>`,
  weekly: `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Weekly Digest</title>
</head>
<body style="margin:0; padding:0; background-color:#eef2f6; font-family: Arial, sans-serif;">
  <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation">
    <tr>
      <td align="center" style="padding:20px;">
        <table border="0" cellpadding="0" cellspacing="0" width="600" style="background:#ffffff; padding:30px; border-radius:8px;" role="presentation">
          <tr>
            <td>
              <h1 style="color:#0f172a; font-size:20px;">Weekly Tech Roundup #42</h1>
              <p style="color:#475569; font-size:15px; line-height:1.5;">Here are the top stories and code updates from this week in tech and design.</p>
              <hr style="border:none; border-top:1px solid #e2e8f0; margin:20px 0;" />
              <h3 style="color:#1e293b;">1. The Future of Email HTML</h3>
              <p style="color:#64748b; font-size:14px;">Why table layouts still rule email design and how modern tools make them easy to build.</p>
              <a href="https://example.com/story1" style="color:#0284c7; text-decoration:none; font-weight:bold;">Read More &rarr;</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
  transactional: `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
  <title>Order Confirmation #84920</title>
</head>
<body style="margin:0; padding:0; background-color:#f8fafc; font-family: Arial, sans-serif;">
  <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation">
    <tr>
      <td align="center" style="padding:30px 10px;">
        <table border="0" cellpadding="0" cellspacing="0" width="550" style="background:#ffffff; border:1px solid #e2e8f0; border-radius:8px; padding:30px;" role="presentation">
          <tr>
            <td align="center">
              <h2 style="color:#16a34a; margin-top:0;">Thank you for your order!</h2>
              <p style="color:#334155;">Your order #84920 has been processed successfully.</p>
              <table border="0" cellpadding="8" cellspacing="0" width="100%" style="background:#f1f5f9; border-radius:6px; margin:20px 0;" role="presentation">
                <tr><td><strong>Item</strong></td><td align="right"><strong>Qty</strong></td><td align="right"><strong>Price</strong></td></tr>
                <tr><td>Pro Subscription</td><td align="right">1</td><td align="right">€49.00</td></tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
};

// High risk spam words dictionary with categories
const SPAM_TRIGGER_WORDS_CATALOG: { category: string; word: string }[] = [
  // Urgency & Pressure
  { category: 'Urgency & Pressure', word: 'act fast' },
  { category: 'Urgency & Pressure', word: 'act now' },
  { category: 'Urgency & Pressure', word: 'apply now' },
  { category: 'Urgency & Pressure', word: 'buy now' },
  { category: 'Urgency & Pressure', word: 'call now' },
  { category: 'Urgency & Pressure', word: 'click below' },
  { category: 'Urgency & Pressure', word: 'click here' },
  { category: 'Urgency & Pressure', word: 'click now' },
  { category: 'Urgency & Pressure', word: 'do it today' },
  { category: 'Urgency & Pressure', word: 'don\'t hesitate' },
  { category: 'Urgency & Pressure', word: 'ending soon' },
  { category: 'Urgency & Pressure', word: 'expire' },
  { category: 'Urgency & Pressure', word: 'for a limited time' },
  { category: 'Urgency & Pressure', word: 'get it now' },
  { category: 'Urgency & Pressure', word: 'immediately' },
  { category: 'Urgency & Pressure', word: 'instant' },
  { category: 'Urgency & Pressure', word: 'limited time' },
  { category: 'Urgency & Pressure', word: 'now only' },
  { category: 'Urgency & Pressure', word: 'once in a lifetime' },
  { category: 'Urgency & Pressure', word: 'one time' },
  { category: 'Urgency & Pressure', word: 'order now' },
  { category: 'Urgency & Pressure', word: 'time limited' },
  { category: 'Urgency & Pressure', word: 'urgent' },
  { category: 'Urgency & Pressure', word: 'while supplies last' },

  // Financial & Money
  { category: 'Financial & Money', word: '$$$' },
  { category: 'Financial & Money', word: '100% free' },
  { category: 'Financial & Money', word: 'affordable' },
  { category: 'Financial & Money', word: 'bargain' },
  { category: 'Financial & Money', word: 'best price' },
  { category: 'Financial & Money', word: 'big bucks' },
  { category: 'Financial & Money', word: 'buy direct' },
  { category: 'Financial & Money', word: 'cash bonus' },
  { category: 'Financial & Money', word: 'cash prize' },
  { category: 'Financial & Money', word: 'cheap' },
  { category: 'Financial & Money', word: 'claim' },
  { category: 'Financial & Money', word: 'clearance' },
  { category: 'Financial & Money', word: 'credit card offers' },
  { category: 'Financial & Money', word: 'double your income' },
  { category: 'Financial & Money', word: 'earn extra cash' },
  { category: 'Financial & Money', word: 'earn money' },
  { category: 'Financial & Money', word: 'extra income' },
  { category: 'Financial & Money', word: 'fast cash' },
  { category: 'Financial & Money', word: 'financial freedom' },
  { category: 'Financial & Money', word: 'financial independence' },
  { category: 'Financial & Money', word: 'free access' },
  { category: 'Financial & Money', word: 'free gift' },
  { category: 'Financial & Money', word: 'free info' },
  { category: 'Financial & Money', word: 'free trial' },
  { category: 'Financial & Money', word: 'get paid' },
  { category: 'Financial & Money', word: 'hidden assets' },
  { category: 'Financial & Money', word: 'income' },
  { category: 'Financial & Money', word: 'investment' },
  { category: 'Financial & Money', word: 'lowest price' },
  { category: 'Financial & Money', word: 'make money' },
  { category: 'Financial & Money', word: 'million dollars' },
  { category: 'Financial & Money', word: 'money back' },
  { category: 'Financial & Money', word: 'money making' },
  { category: 'Financial & Money', word: 'no cost' },
  { category: 'Financial & Money', word: 'no credit check' },
  { category: 'Financial & Money', word: 'no fees' },
  { category: 'Financial & Money', word: 'no hidden costs' },
  { category: 'Financial & Money', word: 'no obligation' },
  { category: 'Financial & Money', word: 'no purchase necessary' },
  { category: 'Financial & Money', word: 'no risk' },
  { category: 'Financial & Money', word: 'passwords' },
  { category: 'Financial & Money', word: 'pure profit' },
  { category: 'Financial & Money', word: 'quote' },
  { category: 'Financial & Money', word: 'refinance' },
  { category: 'Financial & Money', word: 'risk free' },
  { category: 'Financial & Money', word: 'save $' },
  { category: 'Financial & Money', word: 'special promotion' },
  { category: 'Financial & Money', word: 'unbelievable price' },
  { category: 'Financial & Money', word: 'valuable' },

  // Promises & Guarantees
  { category: 'Promises & Guarantees', word: '100% guaranteed' },
  { category: 'Promises & Guarantees', word: '100% satisfied' },
  { category: 'Promises & Guarantees', word: 'all natural' },
  { category: 'Promises & Guarantees', word: 'as seen on' },
  { category: 'Promises & Guarantees', word: 'be your own boss' },
  { category: 'Promises & Guarantees', word: 'cancel at any time' },
  { category: 'Promises & Guarantees', word: 'certified' },
  { category: 'Promises & Guarantees', word: 'congratulations' },
  { category: 'Promises & Guarantees', word: 'expect to earn' },
  { category: 'Promises & Guarantees', word: 'guaranteed' },
  { category: 'Promises & Guarantees', word: 'miracle' },
  { category: 'Promises & Guarantees', word: 'no catch' },
  { category: 'Promises & Guarantees', word: 'no strings attached' },
  { category: 'Promises & Guarantees', word: 'opportunity' },
  { category: 'Promises & Guarantees', word: 'promise' },
  { category: 'Promises & Guarantees', word: 'risk-free guarantee' },
  { category: 'Promises & Guarantees', word: 'satisfaction guaranteed' },
  { category: 'Promises & Guarantees', word: 'winner' },
  { category: 'Promises & Guarantees', word: 'winning' },
  { category: 'Promises & Guarantees', word: 'you have been selected' },

  // Sales & Marketing Hype
  { category: 'Sales & Hype', word: 'billion dollars' },
  { category: 'Sales & Hype', word: 'bonus' },
  { category: 'Sales & Hype', word: 'casino' },
  { category: 'Sales & Hype', word: 'cheap products' },
  { category: 'Sales & Hype', word: 'deal' },
  { category: 'Sales & Hype', word: 'discount' },
  { category: 'Sales & Hype', word: 'exclusive deal' },
  { category: 'Sales & Hype', word: 'hidden charge' },
  { category: 'Sales & Hype', word: 'increase sales' },
  { category: 'Sales & Hype', word: 'incredible deal' },
  { category: 'Sales & Hype', word: 'join millions' },
  { category: 'Sales & Hype', word: 'marketing solution' },
  { category: 'Sales & Hype', word: 'mass email' },
  { category: 'Sales & Hype', word: 'multi-level marketing' },
  { category: 'Sales & Hype', word: 'no hidden fees' },
  { category: 'Sales & Hype', word: 'offshore' },
  { category: 'Sales & Hype', word: 'online marketing' },
  { category: 'Sales & Hype', word: 'opt in' },
  { category: 'Sales & Hype', word: 'pennies a day' },
  { category: 'Sales & Hype', word: 'potential earnings' },
  { category: 'Sales & Hype', word: 'prize' },
  { category: 'Sales & Hype', word: 'sale' },
  { category: 'Sales & Hype', word: 'shopper' },
  { category: 'Sales & Hype', word: 'special offer' },
  { category: 'Sales & Hype', word: 'success' },
  { category: 'Sales & Hype', word: 'unlimited' },
  { category: 'Sales & Hype', word: 'urgent response' },
  { category: 'Sales & Hype', word: 'work from home' }
];

interface ZipFileItem {
  path: string;
  name: string;
  isHtml: boolean;
  isCss: boolean;
  isImage: boolean;
  dataUrl?: string;
  textContent?: string;
}

export const NewsletterStudio: React.FC = () => {
  useToolTracking('Newsletter Studio');

  // --- States ---
  const [htmlInput, setHtmlInput] = useLocalStorage('newsletter-studio-html', PRESET_TEMPLATES.promo);
  const [subjectLine, setSubjectLine] = useLocalStorage('newsletter-studio-subject', '🔥 Exclusive Offer: Elevate Your Email Marketing Today!');
  const [preheaderText, setPreheaderText] = useLocalStorage('newsletter-studio-preheader', 'Save up to 30% this week only. Check out our bulletproof templates!');
  const [useWhitespacePadder, setUseWhitespacePadder] = useLocalStorage('newsletter-studio-padder', true);
  
  const [activeTab, setActiveTab] = useState<'editor' | 'preview' | 'tools' | 'outlook_linter' | 'vml_studio' | 'bimi_sim' | 'spam_check' | 'campaign_workflow'>('editor');
  
  // Outlook Linter Issues State
  const [outlookLintIssues, setOutlookLintIssues] = useState<{ severity: 'error' | 'warning' | 'info'; property: string; tagOrSelector: string; reason: string; suggestion: string }[]>([]);
  
  // Sender & BIMI States
  const [senderName, setSenderName] = useLocalStorage('newsletter-studio-sender-name', 'YES Investment Media');
  const [senderEmail, setSenderEmail] = useLocalStorage('newsletter-studio-sender-email', 'newsletter@yes-investmedia.de');
  const [bimiLogoUrl, setBimiLogoUrl] = useLocalStorage('newsletter-studio-bimi-logo', 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=120&auto=format&fit=crop&q=80');
  const [hasVmcBadge, setHasVmcBadge] = useLocalStorage('newsletter-studio-vmc-badge', true);

  // Floating Outlook Guard State
  const [isOutlookGuardEnabled, setIsOutlookGuardEnabled] = useLocalStorage('newsletter-studio-outlook-guard', true);

  // Multi-Client Virtualized Preview States
  const [clientDeviceFrame, setClientDeviceFrame] = useState<'iphone15' | 'pixel8' | 'outlook365' | 'gmail_web' | 'apple_mail'>('iphone15');
  const [simulatedCssEngine, setSimulatedCssEngine] = useState<'standard' | 'outlook_mso'>('standard');

  // Campaign Workflow & ESP Transpiler States
  const [utmTerm, setUtmTerm] = useState('email_newsletter');
  const [utmContent, setUtmContent] = useState('main_cta');
  const [sourceEsp, setSourceEsp] = useState<'mailchimp' | 'klaviyo' | 'hubspot' | 'sendgrid'>('mailchimp');
  const [targetEsp, setTargetEsp] = useState<'klaviyo' | 'mailchimp' | 'hubspot' | 'sendgrid'>('klaviyo');
  const [extractedPlainText, setExtractedPlainText] = useState<string>('');

  // Preview mode states
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [isPreviewDarkMode, setIsPreviewDarkMode] = useState<boolean>(false);

  // Link Replacer & UTM states
  const [smartLinkTarget, setSmartLinkTarget] = useState('{{link}}');
  const [utmSource, setUtmSource] = useState('newsletter');
  const [utmMedium, setUtmMedium] = useState('email');
  const [utmCampaign, setUtmCampaign] = useState('summer_promo');

  // VML Button Generator States
  const [vmlText, setVmlText] = useState('Click Here Now');
  const [vmlUrl, setVmlUrl] = useState('https://example.com');
  const [vmlBgColor, setVmlBgColor] = useState('#2563eb');
  const [vmlTextColor, setVmlTextColor] = useState('#ffffff');
  const [vmlWidth, setVmlWidth] = useState(220);
  const [vmlHeight, setVmlHeight] = useState(48);
  const [vmlRadius, setVmlRadius] = useState(8);

  // VML Hero Background Generator States
  const [vmlBgImgUrl, setVmlBgImgUrl] = useState('https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=1200&auto=format&fit=crop&q=80');
  const [vmlBgWidth, setVmlBgWidth] = useState(600);
  const [vmlBgHeight, setVmlBgHeight] = useState(280);
  const [vmlBgColorFallback, setVmlBgColorFallback] = useState('#1e293b');
  const [vmlBgContentTitle, setVmlBgContentTitle] = useState('Special Outlook Hero Header');

  // ZIP Upload States
  const [zipFileName, setZipFileName] = useState<string>('');
  const [copiedNotification, setCopiedNotification] = useState<string>('');

  // Invasive Change Safeguard Modal State
  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    title: string;
    operationCategory: string;
    riskLevel: 'high' | 'medium' | 'low';
    summaryDescription: string;
    items: InvasiveChangeItem[];
    onConfirm: (selectedItemIds: string[]) => void;
  }>({
    isOpen: false,
    title: '',
    operationCategory: '',
    riskLevel: 'medium',
    summaryDescription: '',
    items: [],
    onConfirm: () => {},
  });

  // Auto Analysis Output States
  const [auditIssues, setAuditIssues] = useState<{ level: 'error' | 'warning' | 'info'; title: string; desc: string }[]>([]);
  const [spamScore, setSpamScore] = useState<number>(0);
  const [detectedSpamWords, setDetectedSpamWords] = useState<string[]>([]);
  const [detectedSpamDetailed, setDetectedSpamDetailed] = useState<{ word: string; category: string; location: 'subject' | 'body' | 'both' }[]>([]);
  const [htmlByteSize, setHtmlByteSize] = useState<number>(0);
  
  // Image-to-Text Ratio State
  const [imageTextRatioData, setImageTextRatioData] = useState<{
    visibleChars: number;
    wordCount: number;
    imgCount: number;
    textPercent: number;
    imgPercent: number;
    ratioStatus: 'optimal' | 'moderate' | 'high_risk';
  }>({
    visibleChars: 0,
    wordCount: 0,
    imgCount: 0,
    textPercent: 100,
    imgPercent: 0,
    ratioStatus: 'optimal'
  });

  // Broken Links & Placeholders State
  const [linkDetectorData, setLinkDetectorData] = useState<{
    missingAltCount: number;
    placeholderLinksCount: number;
    unreplacedMergeTags: string[];
    insecureHttpCount: number;
    totalLinks: number;
  }>({
    missingAltCount: 0,
    placeholderLinksCount: 0,
    unreplacedMergeTags: [],
    insecureHttpCount: 0,
    totalLinks: 0
  });

  // Multi-Client Audit State
  const [clientAuditSummary, setClientAuditSummary] = useState<{
    name: string;
    badge: 'pass' | 'warning' | 'fail';
    checks: { name: string; passed: boolean; desc: string }[];
  }[]>([]);

  // --- Real-time Audit & Spam Analyzer Effect ---
  useEffect(() => {
    if (!htmlInput) return;

    const size = new Blob([htmlInput]).size;
    setHtmlByteSize(size);

    const issues: { level: 'error' | 'warning' | 'info'; title: string; desc: string }[] = [];

    // 1. Gmail 102KB Clipping
    if (size > 102 * 1024) {
      issues.push({
        level: 'error',
        title: 'Gmail Clipping Risk (>102KB)',
        desc: `Your HTML size is ${(size / 1024).toFixed(1)}KB. Gmail will truncate emails exceeding 102KB with "[Message clipped]".`
      });
    } else if (size > 85 * 1024) {
      issues.push({
        level: 'warning',
        title: 'Approaching Gmail Clipping Limit',
        desc: `Your HTML size is ${(size / 1024).toFixed(1)}KB. Try minifying or cleaning unused tags.`
      });
    }

    // 2. Missing Viewport
    if (!/<meta[^>]+viewport/i.test(htmlInput)) {
      issues.push({
        level: 'warning',
        title: 'Missing Mobile Viewport Tag',
        desc: 'Add viewport meta tag for mobile responsiveness.'
      });
    }

    // 3. Flexbox or CSS Grid warnings
    if (/display\s*:\s*(flex|grid)/i.test(htmlInput)) {
      issues.push({
        level: 'warning',
        title: 'Flexbox / CSS Grid Detected',
        desc: 'Outlook Desktop (2016-2021) does not support CSS Flexbox or Grid. Use standard HTML table layouts.'
      });
    }

    // 4. Missing DPI Fix
    if (!/PixelsPerInch/i.test(htmlInput)) {
      issues.push({
        level: 'info',
        title: 'Missing 96 DPI Scaling Meta',
        desc: 'Windows Outlook at 120 DPI scaling might distort layout widths. Inject PixelsPerInch fix.'
      });
    }

    // 5. Missing Alt attributes
    const imgMatches = htmlInput.match(/<img[^>]*>/gi) || [];
    let missingAltCount = 0;
    imgMatches.forEach(img => {
      if (!/alt=["']/i.test(img)) missingAltCount++;
    });
    if (missingAltCount > 0) {
      issues.push({
        level: 'info',
        title: `${missingAltCount} Image(s) Missing Alt Text`,
        desc: 'Add alt text to prevent screen reader defects and spam flags.'
      });
    }

    setAuditIssues(issues);

    // --- Outlook CSS Support Linter ---
    const lintList: { severity: 'error' | 'warning' | 'info'; property: string; tagOrSelector: string; reason: string; suggestion: string }[] = [];

    // 1. max-width
    if (/style=["'][^"']*max-width\s*:/i.test(htmlInput) || /max-width\s*:/i.test(htmlInput)) {
      if (!/<!--\[if mso\]>/i.test(htmlInput)) {
        lintList.push({
          severity: 'error',
          property: 'max-width',
          tagOrSelector: 'table / container',
          reason: 'Outlook Desktop (2007-2021) ignores max-width CSS and expands elements to 100% width.',
          suggestion: 'Wrap in MSO Ghost Table (<!--[if mso]><table width="600">) or set fixed HTML width="..." attribute.'
        });
      }
    }

    // 2. border-radius
    if (/border-radius\s*:/i.test(htmlInput)) {
      lintList.push({
        severity: 'warning',
        property: 'border-radius',
        tagOrSelector: 'button / container',
        reason: 'Outlook Desktop Word engine renders all corners square. Rounded corners will be ignored.',
        suggestion: 'Use VML roundrect (<v:roundrect>) for bulletproof rounded buttons in Outlook.'
      });
    }

    // 3. box-shadow
    if (/box-shadow\s*:/i.test(htmlInput)) {
      lintList.push({
        severity: 'info',
        property: 'box-shadow',
        tagOrSelector: 'card / image',
        reason: 'Outlook Desktop completely ignores CSS box-shadow drop shadows.',
        suggestion: 'Use subtle 1px border lines or rasterized background graphics for shadows.'
      });
    }

    // 4. position: absolute / relative / fixed
    if (/position\s*:\s*(absolute|relative|fixed)/i.test(htmlInput)) {
      lintList.push({
        severity: 'error',
        property: 'position: absolute / relative',
        tagOrSelector: 'positioned element',
        reason: 'Outlook Word rendering engine breaks layout flow when position properties are applied.',
        suggestion: 'Use standard nested HTML table cell alignment (align="left|center|right", valign="top|middle|bottom").'
      });
    }

    // 5. margin: auto / margin: 0 auto
    if (/margin\s*:\s*([^"';]*auto)/i.test(htmlInput) || /margin-left\s*:\s*auto/i.test(htmlInput)) {
      lintList.push({
        severity: 'warning',
        property: 'margin: auto',
        tagOrSelector: 'table / container',
        reason: 'Outlook Desktop ignores CSS margin auto for centering tables.',
        suggestion: 'Add align="center" attribute directly to the <table> tag.'
      });
    }

    // 6. display: flex / display: grid
    if (/display\s*:\s*(flex|grid)/i.test(htmlInput)) {
      lintList.push({
        severity: 'error',
        property: 'display: flex / grid',
        tagOrSelector: 'flex/grid container',
        reason: 'Outlook Desktop completely ignores Flexbox and Grid, stacking all column items vertically.',
        suggestion: 'Run "Flexbox/Grid to Table Transpiler" to convert into nested <table> cells.'
      });
    }

    // 7. background-image without VML
    if (/background-image\s*:/i.test(htmlInput) && !/<v:fill/i.test(htmlInput)) {
      lintList.push({
        severity: 'warning',
        property: 'background-image',
        tagOrSelector: 'hero / container',
        reason: 'Outlook Desktop ignores CSS background-image attributes on tables and divs.',
        suggestion: 'Use VML Hero Background Generator (<v:rect><v:fill type="tile"...>) for 100% Outlook support.'
      });
    }

    // 8. padding on <a> anchor tags
    if (/<a[^>]*style=["'][^"']*padding\s*:/i.test(htmlInput)) {
      lintList.push({
        severity: 'warning',
        property: 'padding on <a>',
        tagOrSelector: '<a> link',
        reason: 'Outlook Desktop ignores vertical padding on inline <a> anchor tags.',
        suggestion: 'Apply background-color and padding to parent <td> cell or generate VML roundrect Button.'
      });
    }

    // 9. Unsupported units
    if (/:\s*[^;"]*?\b(\d+rem|\d+em|\d+vh|\d+vw|calc\()/i.test(htmlInput)) {
      lintList.push({
        severity: 'warning',
        property: 'rem / em / vh / vw / calc()',
        tagOrSelector: 'CSS declarations',
        reason: 'Outlook Desktop does not calculate relative viewport units, rem, or calc().',
        suggestion: 'Use explicit pixel (px) values or percentage (%) widths.'
      });
    }

    setOutlookLintIssues(lintList);

    setOutlookLintIssues(lintList);

    // --- Image-to-Text Ratio Auditor ---
    const plainText = htmlInput
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    const visibleChars = plainText.length;
    const wordCount = plainText ? plainText.split(/\s+/).length : 0;
    const imgCount = imgMatches.length;

    const totalEstimatedUnits = visibleChars + (imgCount * 250);
    const textPercent = totalEstimatedUnits > 0 ? Math.round((visibleChars / totalEstimatedUnits) * 100) : 100;
    const imgPercent = 100 - textPercent;

    let ratioStatus: 'optimal' | 'moderate' | 'high_risk' = 'optimal';
    if (textPercent < 40) {
      ratioStatus = 'high_risk';
    } else if (textPercent < 60) {
      ratioStatus = 'moderate';
    }

    setImageTextRatioData({
      visibleChars,
      wordCount,
      imgCount,
      textPercent,
      imgPercent,
      ratioStatus
    });

    // --- Broken Links & Placeholder Detector ---
    const allLinks = htmlInput.match(/<a[^>]*>/gi) || [];
    let placeholderLinksCount = 0;
    let insecureHttpCount = 0;

    allLinks.forEach(link => {
      if (/href=["'](#|javascript:void\(0\)|javascript:;|https?:\/\/example\.com\/?[^"']*)["']/i.test(link)) {
        placeholderLinksCount++;
      }
      if (/href=["']http:\/\//i.test(link)) {
        insecureHttpCount++;
      }
    });

    const mergeTagMatches = htmlInput.match(/\*\|[A-Z0-9_]+\|\*|\{\{[a-zA-Z0-9_.]+\}\}|%[A-Z0-9_]+%|\[[A-Z_]{3,}\]/g) || [];
    const uniqueMergeTags: string[] = Array.from(new Set(mergeTagMatches));

    setLinkDetectorData({
      missingAltCount,
      placeholderLinksCount,
      unreplacedMergeTags: uniqueMergeTags,
      insecureHttpCount,
      totalLinks: allLinks.length
    });

    // --- Spam Word Analysis (Detailed & Categorized) ---
    const subjectLower = subjectLine.toLowerCase();
    const bodyLower = plainText.toLowerCase();
    const foundSpamDetailed: { word: string; category: string; location: 'subject' | 'body' | 'both' }[] = [];

    SPAM_TRIGGER_WORDS_CATALOG.forEach(item => {
      const inSub = subjectLower.includes(item.word.toLowerCase());
      const inBody = bodyLower.includes(item.word.toLowerCase());
      if (inSub && inBody) {
        foundSpamDetailed.push({ word: item.word, category: item.category, location: 'both' });
      } else if (inSub) {
        foundSpamDetailed.push({ word: item.word, category: item.category, location: 'subject' });
      } else if (inBody) {
        foundSpamDetailed.push({ word: item.word, category: item.category, location: 'body' });
      }
    });

    setDetectedSpamDetailed(foundSpamDetailed);
    setDetectedSpamWords(foundSpamDetailed.map(i => i.word));

    // --- Multi-Client Inbox Audit ---
    const clientMatrix = [
      {
        name: 'Gmail (Web & Mobile)',
        badge: (size <= 102 * 1024 && missingAltCount === 0 && !/display\s*:\s*(flex|grid)/i.test(htmlInput)) ? ('pass' as const) : size > 102 * 1024 ? ('fail' as const) : ('warning' as const),
        checks: [
          { name: 'Under 102KB Truncation Threshold', passed: size <= 102 * 1024, desc: size > 102 * 1024 ? `Size is ${(size / 1024).toFixed(1)}KB (Exceeds 102KB)` : `Size is ${(size / 1024).toFixed(1)}KB (Safe)` },
          { name: 'Display: Block on Images', passed: imgMatches.every(img => /display\s*:\s*block/i.test(img)), desc: 'Removes 3px bottom inline space in Gmail' },
          { name: 'Mobile Viewport Meta Tag', passed: /<meta[^>]+viewport/i.test(htmlInput), desc: 'Ensures correct mobile zoom ratio' }
        ]
      },
      {
        name: 'Outlook (Desktop 2007-2021)',
        badge: (!/display\s*:\s*(flex|grid)/i.test(htmlInput) && (!/max-width\s*:/i.test(htmlInput) || /<!--\[if mso\]>/i.test(htmlInput))) ? ('pass' as const) : ('fail' as const),
        checks: [
          { name: 'No Flexbox or CSS Grid', passed: !/display\s*:\s*(flex|grid)/i.test(htmlInput), desc: 'Word rendering engine requires HTML <table> cells' },
          { name: 'MSO Ghost Table or Fixed Widths', passed: !/max-width\s*:/i.test(htmlInput) || /<!--\[if mso\]>/i.test(htmlInput), desc: 'Prevents tables expanding to 100% width' },
          { name: 'VML Vector Support for Buttons', passed: !/border-radius\s*:/i.test(htmlInput) || /<v:roundrect/i.test(htmlInput), desc: 'Ensures rounded buttons render cleanly' }
        ]
      },
      {
        name: 'Apple Mail (iOS & macOS)',
        badge: (/@media/i.test(htmlInput) && /color-scheme/i.test(htmlInput)) ? ('pass' as const) : ('warning' as const),
        checks: [
          { name: 'Dark Mode Support Meta', passed: /color-scheme/i.test(htmlInput) || /prefers-color-scheme/i.test(htmlInput), desc: 'Prevents automatic dark inversion glitches' },
          { name: 'Responsive Media Queries', passed: /@media/i.test(htmlInput), desc: 'Fluid column stacking on mobile screens' }
        ]
      },
      {
        name: 'Yahoo Mail & AOL',
        badge: (missingAltCount === 0 && !/position\s*:\s*absolute/i.test(htmlInput)) ? ('pass' as const) : ('warning' as const),
        checks: [
          { name: 'Inlined CSS Attributes', passed: !/<style[^>]*>/i.test(htmlInput) || /style=["']/i.test(htmlInput), desc: 'Styles preserved in webmail' },
          { name: 'No Position Absolute', passed: !/position\s*:\s*absolute/i.test(htmlInput), desc: 'Flow layout remains intact' }
        ]
      },
      {
        name: 'Thunderbird & Samsung Mail',
        badge: (/table/i.test(htmlInput) && missingAltCount === 0) ? ('pass' as const) : ('warning' as const),
        checks: [
          { name: 'Semantic Table Markup', passed: /cellpadding/i.test(htmlInput) || /cellspacing/i.test(htmlInput), desc: 'Standard table padding compliance' },
          { name: 'Image Alt Text Descriptions', passed: missingAltCount === 0, desc: 'Fallback text when images are blocked' }
        ]
      },
      {
        name: 'ProtonMail & Secure Mail',
        badge: (insecureHttpCount === 0 && !/<script/i.test(htmlInput)) ? ('pass' as const) : ('fail' as const),
        checks: [
          { name: 'All Assets Loaded Over HTTPS', passed: insecureHttpCount === 0, desc: 'Prevents mixed content warnings' },
          { name: 'No JavaScript Executables', passed: !/<script/i.test(htmlInput), desc: 'Passes security sanitizer filters' }
        ]
      }
    ];

    setClientAuditSummary(clientMatrix);

    // --- Deliverability Risk Score Calculation ---
    let calcScore = 0;
    calcScore += foundSpamDetailed.length * 10;
    if (subjectLine.includes('!')) calcScore += 8;
    if (subjectLine.length > 0 && subjectLine.toUpperCase() === subjectLine) calcScore += 20;
    if (size > 102 * 1024) calcScore += 25;
    if (textPercent < 40) calcScore += 20;
    if (missingAltCount > 0) calcScore += 10;
    if (placeholderLinksCount > 0) calcScore += 10;
    if (insecureHttpCount > 0) calcScore += 15;

    setSpamScore(Math.min(100, calcScore));

  }, [htmlInput, subjectLine]);

  // Handlers & Actions

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedNotification(label);
    setTimeout(() => setCopiedNotification(''), 2500);
  };

  // 1. CSS Inliner with @media Preservation
  const handleInlineCss = () => {
    let result = htmlInput;
    const styleBlocks: string[] = (htmlInput.match(/<style[^>]*>([\s\S]*?)<\/style>/gi) as string[]) || [];
    if (styleBlocks.length === 0) {
      copyToClipboard(result, 'No <style> blocks found to inline.');
      return;
    }

    let preservedRules: string[] = [];
    let inlineRulesMap: Record<string, string> = {};

    styleBlocks.forEach((styleBlock: string) => {
      const cleanCss = styleBlock.replace(/<\/?style[^>]*>/gi, '');

      // Extract and preserve @media blocks and keyframes
      const mediaRegex = /@media[^{]+\{[\s\S]+?\n*\s*\}\s*\}/gi;
      let mediaMatch: RegExpExecArray | null;
      let cssTextWithoutMedia = cleanCss;

      while ((mediaMatch = mediaRegex.exec(cleanCss)) !== null) {
        preservedRules.push(mediaMatch[0]);
      }
      cssTextWithoutMedia = cssTextWithoutMedia.replace(mediaRegex, '');

      // Extract standard rules: selector { props }
      const ruleRegex = /([^{]+)\{([^}]+)\}/g;
      let ruleMatch: RegExpExecArray | null;
      while ((ruleMatch = ruleRegex.exec(cssTextWithoutMedia)) !== null) {
        const selector = ruleMatch[1].trim();
        const declarations = ruleMatch[2].trim().replace(/\n/g, ' ');

        // Preserve pseudo-classes (:hover, :visited, etc), @-rules, or root
        if (selector.includes(':') || selector.startsWith('@') || selector.includes('[')) {
          preservedRules.push(`${selector} { ${declarations} }`);
        } else {
          if (inlineRulesMap[selector]) {
            inlineRulesMap[selector] += `; ${declarations}`;
          } else {
            inlineRulesMap[selector] = declarations;
          }
        }
      }
    });

    // Apply inline style attributes to matching elements
    Object.entries(inlineRulesMap).forEach(([selector, cssProps]) => {
      try {
        if (selector.startsWith('.')) {
          const className = selector.slice(1);
          const regex = new RegExp(`(<[a-z0-9]+\\s+[^>]*class=["'][^"']*\\b${className}\\b[^"']*["'][^>]*>)`, 'gi');
          result = result.replace(regex, (m) => {
            if (/style=["']/i.test(m)) {
              return m.replace(/style=["']([^"']*)["']/i, `style="$1; ${cssProps}"`);
            } else {
              return m.replace(/>$/, ` style="${cssProps}">`);
            }
          });
        } else if (selector.startsWith('#')) {
          const idName = selector.slice(1);
          const regex = new RegExp(`(<[a-z0-9]+\\s+[^>]*id=["']${idName}["'][^>]*>)`, 'gi');
          result = result.replace(regex, (m) => {
            if (/style=["']/i.test(m)) {
              return m.replace(/style=["']([^"']*)["']/i, `style="$1; ${cssProps}"`);
            } else {
              return m.replace(/>$/, ` style="${cssProps}">`);
            }
          });
        } else if (/^[a-z0-9]+$/i.test(selector)) {
          const regex = new RegExp(`(<${selector}(\\s+[^>]*)?>)`, 'gi');
          result = result.replace(regex, (m) => {
            if (/style=["']/i.test(m)) {
              return m.replace(/style=["']([^"']*)["']/i, `style="$1; ${cssProps}"`);
            } else {
              return m.replace(/>$/, ` style="${cssProps}">`);
            }
          });
        }
      } catch (e) {
        // ignore regex errors
      }
    });

    // Strip original inlineable <style> blocks and re-inject preserved @media rules block in <head>
    result = result.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
    if (preservedRules.length > 0) {
      const preservedStyleBlock = `<style type="text/css">\n${preservedRules.join('\n')}\n</style>`;
      if (/<\/head>/i.test(result)) {
        result = result.replace('</head>', `${preservedStyleBlock}\n</head>`);
      } else {
        result = preservedStyleBlock + '\n' + result;
      }
    }

    setHtmlInput(result);
    copyToClipboard(result, 'CSS inlined while preserving responsive @media rules!');
  };

  // 2. Flexbox/Grid to Table Transpiler
  const handleTranspileFlexToTables = () => {
    let result = htmlInput;
    let count = 0;

    // Convert divs/containers with display:flex or display:grid into nested email-safe <table> cells
    result = result.replace(/<div([^>]*style=["'][^"']*display\s*:\s*(flex|grid)[^"']*["'][^>]*)>([\s\S]*?)<\/div>/gi, (match, attrs, type, content) => {
      count++;
      // Extract direct children or split by top-level tags
      const childMatches = content.match(/<[a-z0-9]+[^>]*>[\s\S]*?<\/[a-z0-9]+>/gi) || [];
      let cellsHtml = '';

      if (childMatches.length > 0) {
        cellsHtml = childMatches.map(child => `  <td align="left" valign="top" style="padding: 10px;">\n    ${child}\n  </td>`).join('\n');
      } else {
        cellsHtml = `  <td align="left" valign="top" style="padding: 10px;">\n    ${content}\n  </td>`;
      }

      const cleanAttrs = attrs.replace(/display\s*:\s*(flex|grid);?/gi, '');

      return `<!-- Transpiled ${type.toUpperCase()} Container to Email-Safe Table -->\n<table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation"${cleanAttrs.includes('style=') ? cleanAttrs : ' style="width:100%;"'}>\n  <tr>\n${cellsHtml}\n  </tr>\n</table>`;
    });

    // Also strip display:flex / display:grid from inline styles
    result = result.replace(/style=["']([^"']*);?\s*display\s*:\s*(flex|grid);?\s*([^"']*)["']/gi, 'style="$1; $3"');

    setHtmlInput(result);
    copyToClipboard(result, count > 0 ? `Transpiled ${count} Flexbox/Grid container(s) to email <table> cells!` : 'Cleaned Flexbox/Grid declarations for email safety.');
  };

  // 2. Outlook Table Auto-Fixer
  const handleFixTables = () => {
    let result = htmlInput.replace(/<table([^>]*)>/gi, (match, attrs) => {
      let newAttrs = attrs;
      if (!/border=["']/i.test(newAttrs)) newAttrs += ' border="0"';
      if (!/cellpadding=["']/i.test(newAttrs)) newAttrs += ' cellpadding="0"';
      if (!/cellspacing=["']/i.test(newAttrs)) newAttrs += ' cellspacing="0"';
      if (!/role=["']/i.test(newAttrs)) newAttrs += ' role="presentation"';
      return `<table${newAttrs}>`;
    });
    setHtmlInput(result);
  };

  // 3. MSO Ghost Table Generator
  const handleInjectMsoGhostTables = () => {
    let result = htmlInput;
    // Inject conditional wraparound for responsive main container tables or max-width tables
    if (!/<!--\[if mso\]>\s*<table/i.test(result)) {
      result = result.replace(
        /(<table[^>]*class=["'][^"']*responsive-table[^"']*["'][^>]*>)/gi,
        `<!--[if mso]>\n<table align="center" border="0" cellspacing="0" cellpadding="0" width="600" role="presentation">\n<tr>\n<td align="center" valign="top" width="600">\n<![endif]-->\n$1`
      );
      result = result.replace(
        /(<\/table>\s*<\/td>\s*<\/tr>\s*<\/table>)/gi,
        `$1\n<!--[if mso]>\n</td>\n</tr>\n</table>\n<![endif]-->`
      );
      setHtmlInput(result);
      copyToClipboard(result, 'MSO Ghost Tables injected!');
    } else {
      copyToClipboard(result, 'MSO Ghost Tables already present.');
    }
  };

  // 4. DPI Scaling & o:PixelsPerInch Auto-Fixer
  const handleInjectDpiFix = () => {
    let result = htmlInput;

    // Ensure xmlns:v and xmlns:o on <html>
    if (/<html/i.test(result)) {
      result = result.replace(
        /<html([^>]*)>/i,
        (match, attrs) => {
          let newAttrs = attrs;
          if (!/xmlns:v=/i.test(newAttrs)) newAttrs += ' xmlns:v="urn:schemas-microsoft-com:vml"';
          if (!/xmlns:o=/i.test(newAttrs)) newAttrs += ' xmlns:o="urn:schemas-microsoft-com:office:office"';
          return `<html${newAttrs}>`;
        }
      );
    }

    const dpiBlock = `
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:AllowPNG/>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->`;

    if (!/PixelsPerInch/i.test(result)) {
      if (/<\/head>/i.test(result)) {
        result = result.replace('</head>', `${dpiBlock}\n</head>`);
      } else {
        result = dpiBlock + '\n' + result;
      }
      setHtmlInput(result);
      copyToClipboard(result, 'DPI 96px fix injected!');
    } else {
      copyToClipboard(result, 'DPI settings already present.');
    }
  };

  // 5. Gmail 3px Image Gap Eliminator
  const handleFixImages = () => {
    let count = 0;
    let result = htmlInput.replace(/<img([^>]*)>/gi, (match, attrs) => {
      count++;
      let newAttrs = attrs;
      if (!/alt=["']/i.test(newAttrs)) newAttrs += ' alt=""';
      if (!/border=["']/i.test(newAttrs)) newAttrs += ' border="0"';

      if (/style=["']/i.test(newAttrs)) {
        newAttrs = newAttrs.replace(/style=["']([^"']*)["']/i, (m, styleContent) => {
          let updated = styleContent;
          if (!/display\s*:\s*block/i.test(updated)) {
            updated = `display: block; ${updated}`;
          }
          if (!/border\s*:\s*0/i.test(updated) && !/border\s*:\s*none/i.test(updated)) {
            updated = `${updated}; border: 0;`;
          }
          return `style="${updated}"`;
        });
      } else {
        newAttrs += ' style="display: block; border: 0;"';
      }
      return `<img${newAttrs}>`;
    });

    setHtmlInput(result);
    copyToClipboard(result, `Gmail 3px image gap fix applied to ${count} image tag(s)!`);
  };

  // 5b. Minify HTML for Gmail 102KB Limit
  const handleMinifyHtml = () => {
    let result = htmlInput;
    result = result.replace(/<!--(?!\[if\s+mso\])[\s\S]*?-->/gi, '');
    result = result.replace(/>\s+</g, '><');
    result = result.trim();
    setHtmlInput(result);
    const newSize = new Blob([result]).size;
    copyToClipboard(result, `Minified HTML! Size reduced to ${(newSize / 1024).toFixed(1)}KB`);
  };

  // 5c. Auto Fix Missing Alt Tags
  const handleFixMissingAltTags = () => {
    let count = 0;
    let result = htmlInput.replace(/<img([^>]*)>/gi, (match, attrs) => {
      if (!/alt=["']/i.test(attrs)) {
        count++;
        return `<img${attrs} alt="" />`;
      }
      return match;
    });
    setHtmlInput(result);
    copyToClipboard(result, `Added empty alt="" attributes to ${count} image(s)!`);
  };

  // 5e. Fix All-Caps Subject Line
  const handleFixAllCapsSubject = () => {
    if (!subjectLine) return;
    const formatted = subjectLine
      .toLowerCase()
      .replace(/(?:^|\s|-)\w/g, c => c.toUpperCase());
    setSubjectLine(formatted);
    copyToClipboard(formatted, 'Converted subject line to Title Case!');
  };

  // 5f. Fix Excessive Exclamation Marks
  const handleFixExclamationMarks = () => {
    let newSub = subjectLine.replace(/!{2,}/g, '!');
    setSubjectLine(newSub);

    let newHtml = htmlInput.replace(/!{2,}/g, '!');
    setHtmlInput(newHtml);
    copyToClipboard(newHtml, 'Normalized excessive exclamation marks in subject & body!');
  };

  // 5g. Fix Hidden Text Traps
  const handleFixHiddenTextTraps = () => {
    let result = htmlInput;
    // Replace font-size: 0px or display: none or opacity: 0 on text elements
    result = result.replace(/style=["']([^"']*)(font-size:\s*0(?:px)?|display:\s*none|opacity:\s*0|visibility:\s*hidden)([^"']*)["']/gi, (match, p1, p2, p3) => {
      return `style="${p1}font-size:11px; display:inline-block; opacity:1; visibility:visible${p3}"`;
    });
    setHtmlInput(result);
    copyToClipboard(result, 'Cleaned hidden text traps & zero-font-size CSS rules!');
  };

  // 5h. Fix High-Risk Spam Phrases
  const handleFixSpamPhrases = () => {
    const replacements: { [key: string]: string } = {
      '100% free': 'complimentary',
      '100% satisfied': 'guaranteed satisfaction',
      'click here': 'learn more',
      'buy now': 'explore now',
      'act fast': 'limited availability',
      'make money': 'generate revenue',
      'cash bonus': 'reward',
      'no catch': 'transparent terms',
      'urgent': 'important update',
      'risk free': 'worry free',
      'double your income': 'grow your income'
    };

    let newSub = subjectLine;
    let newHtml = htmlInput;

    Object.entries(replacements).forEach(([bad, good]) => {
      const reg = new RegExp(bad, 'gi');
      newSub = newSub.replace(reg, good);
      newHtml = newHtml.replace(reg, good);
    });

    setSubjectLine(newSub);
    setHtmlInput(newHtml);
    copyToClipboard(newHtml, 'Replaced spam trigger phrases with deliverability-safe wording!');
  };

  // 5i. Floating Outlook Guard Enforcer
  const handleApplyOutlookGuard = () => {
    let result = htmlInput;

    // 1. Ensure Office XML in <head>
    if (!/xmlns:o="urn:schemas-microsoft-com:office:office"/i.test(result)) {
      result = result.replace(/<html/i, '<html xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office"');
    }

    const officeMeta = `<!--[if mso]>
<noscript>
  <xml>
    <o:OfficeDocumentSettings>
      <o:AllowPNG/>
      <o:PixelsPerInch>96</o:PixelsPerInch>
    </o:OfficeDocumentSettings>
  </xml>
</noscript>
<![endif]-->`;

    if (!/PixelsPerInch/i.test(result)) {
      if (/<\/head>/i.test(result)) {
        result = result.replace('</head>', `${officeMeta}\n</head>`);
      } else {
        result = officeMeta + '\n' + result;
      }
    }

    // 2. Ensure Top Container Table is wrapped in MSO Ghost Table if not already wrapped
    if (!/<!--\[if mso\]>/i.test(result)) {
      result = result.replace(/(<table[^>]*role=["']presentation["'][^>]*>)/i, `<!--[if mso]><table width="600" align="center" border="0" cellpadding="0" cellspacing="0" role="presentation"><tr><td><![endif]-->\n$1`);
      result = result.replace(/(<\/table>\s*)$/i, `$1\n<!--[if mso]></td></tr></table><![endif]-->`);
    }

    setHtmlInput(result);
    setIsOutlookGuardEnabled(true);
    copyToClipboard(result, 'Outlook Guard Active: MSO conditional tables & Office XML enforced!');
  };

  // 5i-2. Fix Placeholder Anchors & Links
  const handleFixPlaceholdersAndLinks = () => {
    let count = 0;
    let result = htmlInput.replace(/href=["'](#|javascript:void\(0\)|javascript:;|https?:\/\/example\.com\/?[^"']*)["']/gi, () => {
      count++;
      return 'href="https://yourdomain.com"';
    });
    setHtmlInput(result);
    copyToClipboard(result, `Replaced ${count} placeholder link(s) with production placeholder URL!`);
  };

  // 5j. Master Auto-Optimize All Clients with Invasive Change Safeguard Modal
  const handleMasterAutoOptimize = () => {
    if (!htmlInput) return;
    const items: InvasiveChangeItem[] = [];

    // Gmail gap fixes
    const imgMatches: string[] = htmlInput.match(/<img[^>]*>/gi) || [];
    imgMatches.forEach((img: string, i: number) => {
      if (!/display\s*:\s*block/i.test(img)) {
        items.push({
          id: `opt_img_gap_${i}`,
          type: 'modification',
          title: `Gmail 3px Bottom Gap Fix on Image #${i + 1}`,
          description: 'Inject display: block and border: 0 to prevent Gmail inline image spacing defect',
          beforeSnippet: img,
          afterSnippet: img.replace(/style=["']/i, 'style="display: block; border: 0; '),
          metadata: { type: 'img_gap', original: img }
        });
      }
    });

    // Alt tag additions
    imgMatches.forEach((img: string, i: number) => {
      if (!/alt=["']/i.test(img)) {
        items.push({
          id: `opt_img_alt_${i}`,
          type: 'injection',
          title: `Missing Alt Text Tag on Image #${i + 1}`,
          description: 'Inject fallback alt="" attribute for screen readers & deliverability safety',
          beforeSnippet: img,
          afterSnippet: img.replace(/<img/i, '<img alt=""'),
          metadata: { type: 'img_alt', original: img }
        });
      }
    });

    // Placeholder links
    const placeholderMatches = htmlInput.match(/href=["'](#|javascript:void\(0\)|javascript:;|https?:\/\/example\.com\/?[^"']*)["']/gi) || [];
    placeholderMatches.forEach((pMatch, i) => {
      items.push({
        id: `opt_placeholder_${i}`,
        type: 'replace',
        title: `Placeholder Link Fix #${i + 1}`,
        description: `Replace broken/dummy href with production URL '${vmlUrl || 'https://yourdomain.com'}'`,
        beforeSnippet: pMatch,
        afterSnippet: `href="${vmlUrl || 'https://yourdomain.com'}"`,
        metadata: { type: 'placeholder', original: pMatch }
      });
    });

    // Outlook Guard Table Enforcer
    if (!/<!--\[if mso\]>/i.test(htmlInput)) {
      items.push({
        id: 'opt_mso_wrap',
        type: 'wrap',
        title: 'Outlook Desktop Ghost Table Wrapper',
        description: 'Enforce MSO conditional comments around top container table for Outlook 2007-2021',
        beforeSnippet: '<table role="presentation"...>',
        afterSnippet: '<!--[if mso]><table width="600"...>...<![endif]-->',
        metadata: { type: 'mso_wrap' }
      });
    }

    if (items.length === 0) {
      copyToClipboard(htmlInput, 'All email client optimizations already satisfied!');
      return;
    }

    setModalConfig({
      isOpen: true,
      title: 'Master Multi-Client Auto-Optimization Batch',
      operationCategory: 'Master Client Auto-Optimizer',
      riskLevel: 'high',
      summaryDescription: `Detected ${items.length} structural and client-specific optimizations. Select which changes to apply across your HTML template.`,
      items,
      onConfirm: (selectedIds) => {
        const selectedSet = new Set(selectedIds);
        let result = htmlInput;

        items.forEach((item) => {
          if (!selectedSet.has(item.id)) return;
          const meta = item.metadata;
          if (!meta) return;

          if (meta.type === 'img_gap') {
            result = result.replace(meta.original, (m) => {
              if (/style=["']/i.test(m)) {
                return m.replace(/style=["']([^"']*)["']/i, (sm, styleVal) => `style="display: block; border: 0; ${styleVal}"`);
              }
              return m.replace('<img', '<img style="display: block; border: 0;"');
            });
          } else if (meta.type === 'img_alt') {
            result = result.replace(meta.original, (m) => m.replace('<img', '<img alt=""'));
          } else if (meta.type === 'placeholder') {
            result = result.replace(meta.original, `href="${vmlUrl || 'https://yourdomain.com'}"`);
          } else if (meta.type === 'mso_wrap') {
            if (!/<!--\[if mso\]>/i.test(result)) {
              result = result.replace(/(<table[^>]*role=["']presentation["'][^>]*>)/i, `<!--[if mso]><table width="600" align="center" border="0" cellpadding="0" cellspacing="0" role="presentation"><tr><td><![endif]-->\n$1`);
              result = result.replace(/(<\/table>\s*)$/i, `$1\n<!--[if mso]></td></tr></table><![endif]-->`);
            }
          }
        });

        setHtmlInput(result);
        setModalConfig((prev) => ({ ...prev, isOpen: false }));
        copyToClipboard(result, 'Master Auto-Optimization Complete: Selected client standards enforced!');
      }
    });
  };

  // 5k. ESP Tag Transpiler with Invasive Safeguard Modal
  const handleTranspileEspTags = (toFormat: 'mailchimp' | 'klaviyo' | 'hubspot' | 'sendgrid') => {
    if (!htmlInput) return;
    const maps = {
      mailchimp: { fname: '*|FNAME|*', lname: '*|LNAME|*', email: '*|EMAIL|*', unsub: '*|UNSUB|*' },
      klaviyo: { fname: '{{ first_name }}', lname: '{{ last_name }}', email: '{{ email }}', unsub: '{% unsubscribe %}' },
      hubspot: { fname: '{{ contact.firstname }}', lname: '{{ contact.lastname }}', email: '{{ contact.email }}', unsub: '{{ unsubscribe_link }}' },
      sendgrid: { fname: '{{first_name}}', lname: '{{last_name}}', email: '{{email}}', unsub: '{{{unsubscribe}}}' }
    };
    const target = maps[toFormat];

    const fnameReg = /(\*\|FNAME\|\*|\{\{\s*first_name\s*\}\}|\{\{\s*contact\.firstname\s*\}\})/gi;
    const lnameReg = /(\*\|LNAME\|\*|\{\{\s*last_name\s*\}\}|\{\{\s*contact\.lastname\s*\}\})/gi;
    const emailReg = /(\*\|EMAIL\|\*|\{\{\s*email\s*\}\}|\{\{\s*contact\.email\s*\}\})/gi;
    const unsubReg = /(\*\|UNSUB\|\*|\{%\s*unsubscribe\s*%\}|\{\{\s*unsubscribe_link\s*\}\})/gi;

    const items: InvasiveChangeItem[] = [];

    const fnameMatches = Array.from(new Set(htmlInput.match(fnameReg) || []));
    const lnameMatches = Array.from(new Set(htmlInput.match(lnameReg) || []));
    const emailMatches = Array.from(new Set(htmlInput.match(emailReg) || []));
    const unsubMatches = Array.from(new Set(htmlInput.match(unsubReg) || []));

    fnameMatches.forEach((matchStr, i) => {
      items.push({
        id: `esp_fname_${i}`,
        type: 'transpile',
        title: `First Name Merge Tag: ${matchStr}`,
        description: `Transpile tag to ${toFormat.toUpperCase()} syntax '${target.fname}'`,
        beforeSnippet: matchStr,
        afterSnippet: target.fname,
        metadata: { original: matchStr, targetVal: target.fname }
      });
    });

    lnameMatches.forEach((matchStr, i) => {
      items.push({
        id: `esp_lname_${i}`,
        type: 'transpile',
        title: `Last Name Merge Tag: ${matchStr}`,
        description: `Transpile tag to ${toFormat.toUpperCase()} syntax '${target.lname}'`,
        beforeSnippet: matchStr,
        afterSnippet: target.lname,
        metadata: { original: matchStr, targetVal: target.lname }
      });
    });

    emailMatches.forEach((matchStr, i) => {
      items.push({
        id: `esp_email_${i}`,
        type: 'transpile',
        title: `Email Address Tag: ${matchStr}`,
        description: `Transpile tag to ${toFormat.toUpperCase()} syntax '${target.email}'`,
        beforeSnippet: matchStr,
        afterSnippet: target.email,
        metadata: { original: matchStr, targetVal: target.email }
      });
    });

    unsubMatches.forEach((matchStr, i) => {
      items.push({
        id: `esp_unsub_${i}`,
        type: 'transpile',
        title: `Unsubscribe Footer Tag: ${matchStr}`,
        description: `Transpile tag to ${toFormat.toUpperCase()} syntax '${target.unsub}'`,
        beforeSnippet: matchStr,
        afterSnippet: target.unsub,
        metadata: { original: matchStr, targetVal: target.unsub }
      });
    });

    if (items.length === 0) {
      copyToClipboard(htmlInput, `No dynamic merge tags detected to transpile to ${toFormat.toUpperCase()}.`);
      return;
    }

    setModalConfig({
      isOpen: true,
      title: `Transpile Merge Tags to ${toFormat.toUpperCase()}`,
      operationCategory: 'ESP Tag Transpiler',
      riskLevel: 'medium',
      summaryDescription: `Found ${items.length} dynamic merge tag(s) in template. Review proposed ESP conversions below before executing.`,
      items,
      onConfirm: (selectedIds) => {
        const selectedSet = new Set(selectedIds);
        let newHtml = htmlInput;
        let newSub = subjectLine;

        items.forEach((item) => {
          if (selectedSet.has(item.id) && item.metadata) {
            const { original, targetVal } = item.metadata;
            const escaped = original.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const reg = new RegExp(escaped, 'g');
            newHtml = newHtml.replace(reg, targetVal);
            newSub = newSub.replace(reg, targetVal);
          }
        });

        setHtmlInput(newHtml);
        setSubjectLine(newSub);
        setTargetEsp(toFormat);
        setModalConfig((prev) => ({ ...prev, isOpen: false }));
        copyToClipboard(newHtml, `Transpiled selected merge tags to ${toFormat.toUpperCase()}!`);
      }
    });
  };

  // 6. Preheader Injector with Whitespace Padder
  const handleInjectPreheader = () => {
    if (!preheaderText) return;

    // Build whitespace padder if opt-in toggle is active
    let padder = '&nbsp;&zwnj;'.repeat(120);

    const preheaderHtml = `
<!-- Preheader Snippet with Whitespace Padding -->
<div style="display: none; font-size: 1px; color: #ffffff; line-height: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden; mso-hide: all;">
  ${preheaderText}${useWhitespacePadder ? padder : ''}
</div>`;

    let result = htmlInput;
    if (/<body[^>]*>/i.test(result)) {
      result = result.replace(/(<body[^>]*>)/i, `$1\n${preheaderHtml}`);
    } else {
      result = preheaderHtml + '\n' + result;
    }
    setHtmlInput(result);
    copyToClipboard(result, 'Preheader & Whitespace Padder injected!');
  };

  // 7. Dark Mode Email Optimizer
  const handleInjectDarkModeMeta = () => {
    const metaTags = `
  <!-- Dark Mode Meta Tags & Overrides -->
  <meta name="color-scheme" content="light dark" />
  <meta name="supported-color-schemes" content="light dark" />
  <style type="text/css">
    :root {
      color-scheme: light dark;
      supported-color-schemes: light dark;
    }
    @media (prefers-color-scheme: dark) {
      body, .email-body, .bg-wrapper {
        background-color: #121212 !important;
        color: #ffffff !important;
      }
      .dark-bg {
        background-color: #1e1e1e !important;
      }
      .dark-text {
        color: #ffffff !important;
      }
      .dark-border {
        border-color: #374151 !important;
      }
    }
    /* Outlook Dark Mode Targets */
    [data-ogsc] .dark-text { color: #ffffff !important; }
    [data-ogsb] .dark-bg { background-color: #1e1e1e !important; }
  </style>`;

    let result = htmlInput;
    if (/<head>/i.test(result) || /<\/head>/i.test(result)) {
      if (/<\/head>/i.test(result)) {
        result = result.replace('</head>', `${metaTags}\n</head>`);
      } else {
        result = result.replace('<head>', `<head>\n${metaTags}`);
      }
    } else {
      result = metaTags + '\n' + result;
    }

    setHtmlInput(result);
    copyToClipboard(result, 'Dark Mode Email Optimization meta & media queries injected!');
  };

  // 8. Smart Link Replacer
  const handleReplaceLinks = () => {
    if (!htmlInput) return;
    const result = htmlInput.replace(/href=["']([^"']+)["']/gi, (match, url) => {
      if (url.includes('{') || url.includes('}') || url.includes('*|') || url.startsWith('#')) return match;
      if (url.startsWith('http://') || url.startsWith('https://')) {
        return `href="${smartLinkTarget}"`;
      }
      return match;
    });
    setHtmlInput(result);
  };

  // 9. Append UTM Parameters (Batch Injector) with Invasive Safeguard Modal
  const handleAppendUtm = () => {
    if (!htmlInput) return;
    const matches: { url: string; newUrl: string; fullMatch: string }[] = [];
    const regex = /href=["'](https?:\/\/[^"']+)["']/gi;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(htmlInput)) !== null) {
      const originalUrl = match[1];
      if (originalUrl.includes('{') || originalUrl.includes('}') || originalUrl.includes('*|')) continue;
      try {
        const u = new URL(originalUrl);
        if (utmSource) u.searchParams.set('utm_source', utmSource);
        if (utmMedium) u.searchParams.set('utm_medium', utmMedium);
        if (utmCampaign) u.searchParams.set('utm_campaign', utmCampaign);
        if (utmTerm) u.searchParams.set('utm_term', utmTerm);
        if (utmContent) u.searchParams.set('utm_content', utmContent);

        matches.push({
          url: originalUrl,
          newUrl: u.toString(),
          fullMatch: match[0]
        });
      } catch (e) {}
    }

    if (matches.length === 0) {
      copyToClipboard(htmlInput, 'No external HTTP/HTTPS links found to inject UTM parameters.');
      return;
    }

    const items: InvasiveChangeItem[] = matches.map((m, idx) => ({
      id: `utm_${idx}`,
      type: 'injection',
      title: `Link #${idx + 1}: ${m.url}`,
      description: `Inject UTM parameters: source="${utmSource || 'none'}", medium="${utmMedium || 'none'}", campaign="${utmCampaign || 'none'}"`,
      beforeSnippet: `href="${m.url}"`,
      afterSnippet: `href="${m.newUrl}"`,
      metadata: m
    }));

    setModalConfig({
      isOpen: true,
      title: 'Batch UTM Parameter Injection',
      operationCategory: 'UTM Batch Injector',
      riskLevel: 'medium',
      summaryDescription: `Detected ${matches.length} link(s) ready for campaign tracking injection. Select which links you want to update before executing.`,
      items,
      onConfirm: (selectedIds) => {
        const selectedSet = new Set(selectedIds);
        const selectedMatches = matches.filter((_, idx) => selectedSet.has(`utm_${idx}`));

        let updatedHtml = htmlInput;
        selectedMatches.forEach(m => {
          updatedHtml = updatedHtml.split(`href="${m.url}"`).join(`href="${m.newUrl}"`);
          updatedHtml = updatedHtml.split(`href='${m.url}'`).join(`href='${m.newUrl}'`);
        });

        setHtmlInput(updatedHtml);
        setModalConfig(prev => ({ ...prev, isOpen: false }));
        copyToClipboard(updatedHtml, `Injected UTM parameters on ${selectedMatches.length} selected link(s)!`);
      }
    });
  };

  // 10. Plain Text Extractor
  const handleExtractPlainText = () => {
    let text = htmlInput
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<a\s+[^>]*href=["']([^"']+)["'][^>]*>(.*?)<\/a>/gi, '$2 [$1]')
      .replace(/<\/(div|p|h[1-6]|tr|li)>/gi, '\n')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/\n\s*\n/g, '\n\n')
      .trim();

    copyToClipboard(text, 'Plain text copied!');
  };

  // 11. Format / Beautify HTML
  const handleFormatHtml = () => {
    try {
      const formatted = beautifyHtml(htmlInput, {
        indent_size: 2,
        wrap_line_length: 0,
        preserve_newlines: true
      });
      setHtmlInput(formatted);
    } catch (e) {
      console.error(e);
    }
  };

  // 12. Generate VML Bulletproof Button Code
  const generatedVmlButtonCode = `<!-- Bulletproof VML Button for Outlook & Modern Email Clients -->
<!--[if mso]>
<v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${vmlUrl}" style="height:${vmlHeight}px;v-text-anchor:middle;width:${vmlWidth}px;" arcsize="${Math.round((vmlRadius / vmlHeight) * 100)}%" stroke="f" fillcolor="${vmlBgColor}">
  <w:anchorlock/>
  <center style="color:${vmlTextColor};font-family:Arial,sans-serif;font-size:16px;font-weight:bold;">${vmlText}</center>
</v:roundrect>
<![endif]-->
<!--[if !mso]><!-->
<table border="0" cellpadding="0" cellspacing="0" role="presentation" style="margin: 0;">
  <tr>
    <td align="center" bgcolor="${vmlBgColor}" style="border-radius: ${vmlRadius}px;">
      <a href="${vmlUrl}" target="_blank" style="display: inline-block; padding: 14px 28px; font-size: 16px; color: ${vmlTextColor}; text-decoration: none; font-weight: bold; border-radius: ${vmlRadius}px; background-color: ${vmlBgColor}; line-height: 1;">${vmlText}</a>
    </td>
  </tr>
</table>
<!--<![endif]-->`;

  // 13. Generate VML Hero Background Code
  const generatedVmlHeroCode = `<!-- Outlook VML Hero Background Container -->
<!--[if mso]>
<v:rect xmlns:v="urn:schemas-microsoft-com:vml" fill="true" stroke="false" style="width:${vmlBgWidth}px;height:${vmlBgHeight}px;">
  <v:fill type="tile" src="${vmlBgImgUrl}" color="${vmlBgColorFallback}" />
  <v:textbox inset="0,0,0,0">
<![endif]-->
<div style="background-image: url('${vmlBgImgUrl}'); background-position: center; background-size: cover; background-repeat: no-repeat; width: ${vmlBgWidth}px; height: ${vmlBgHeight}px; background-color: ${vmlBgColorFallback};">
  <table border="0" cellpadding="0" cellspacing="0" width="100%" height="100%" role="presentation">
    <tr>
      <td align="center" valign="middle" style="padding: 30px; text-align: center; color: #ffffff;">
        <h2 style="font-size: 24px; font-weight: bold; margin: 0 0 12px 0;">${vmlBgContentTitle}</h2>
        <p style="font-size: 14px; margin: 0;">Bulletproof background image rendering across all Outlook clients.</p>
      </td>
    </tr>
  </table>
</div>
<!--[if mso]>
  </v:textbox>
</v:rect>
<![endif]-->`;

  const insertIntoEditor = (snippet: string, label: string) => {
    let result = htmlInput;
    if (/<body[^>]*>/i.test(result)) {
      result = result.replace(/(<body[^>]*>)/i, `$1\n${snippet}`);
    } else {
      result = result + '\n' + snippet;
    }
    setHtmlInput(result);
    copyToClipboard(snippet, `${label} inserted into HTML Editor!`);
  };

  // 14. ZIP Upload Handler with Invasive Safeguard Confirmation
  const handleZipUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setZipFileName(file.name);
    try {
      const zip = new JSZip();
      const content = await zip.loadAsync(file);
      const zipItems: ZipFileItem[] = [];

      for (const [relativePath, zipObj] of Object.entries(content.files)) {
        if (zipObj.dir) continue;

        const isHtml = /\.(html|htm)$/i.test(relativePath);
        const isCss = /\.css$/i.test(relativePath);
        const isImage = /\.(png|jpg|jpeg|gif|webp|svg)$/i.test(relativePath);

        let item: ZipFileItem = {
          path: relativePath,
          name: relativePath.split('/').pop() || relativePath,
          isHtml,
          isCss,
          isImage
        };

        if (isHtml || isCss) {
          item.textContent = await zipObj.async('text');
        } else if (isImage) {
          const blob = await zipObj.async('blob');
          item.dataUrl = URL.createObjectURL(blob);
        }

        zipItems.push(item);
      }

      const modalItems: InvasiveChangeItem[] = zipItems.map((zi, idx) => ({
        id: `zip_file_${idx}`,
        type: zi.isHtml ? 'transpile' : zi.isCss ? 'modification' : 'injection',
        title: `Archive Entry: ${zi.path}`,
        description: zi.isHtml ? 'Primary HTML email template document (Will replace current editor workspace state)' : zi.isCss ? 'CSS Stylesheet declaration file' : 'Embedded graphic asset',
        beforeSnippet: zi.isHtml ? 'Current HTML Editor State' : undefined,
        afterSnippet: zi.isHtml ? (zi.textContent?.slice(0, 300) + '...') : undefined,
        metadata: zi
      }));

      setModalConfig({
        isOpen: true,
        title: `ZIP Bundle Import: Overwrite Workspace (${file.name})`,
        operationCategory: 'ZIP Package Importer',
        riskLevel: 'high',
        summaryDescription: `ZIP Archive contains ${zipItems.length} file(s). Importing will replace your current editor content with the selected template and assets.`,
        items: modalItems,
        onConfirm: (selectedIds) => {
          const selectedSet = new Set(selectedIds);
          const approvedZipItems = zipItems.filter((_, idx) => selectedSet.has(`zip_file_${idx}`));

          const primaryHtml = approvedZipItems.find(i => i.isHtml);
          if (primaryHtml && primaryHtml.textContent) {
            let processedHtml = primaryHtml.textContent;

            approvedZipItems.forEach(img => {
              if (img.isImage && img.dataUrl) {
                processedHtml = processedHtml.split(img.path).join(img.dataUrl);
                processedHtml = processedHtml.split(img.name).join(img.dataUrl);
                processedHtml = processedHtml.split(`C:\\fakepath\\${img.name}`).join(img.dataUrl);
                processedHtml = processedHtml.split(`C:/fakepath/${img.name}`).join(img.dataUrl);
              }
            });

            setHtmlInput(processedHtml);
            copyToClipboard(processedHtml, `Loaded ${approvedZipItems.length} archive file(s) into Newsletter Studio!`);
          }
          setModalConfig(prev => ({ ...prev, isOpen: false }));
        }
      });
    } catch (err) {
      console.error("ZIP load error", err);
    }
  };

  // 15. Export Complete Production ZIP Bundle
  const handleExportZip = async () => {
    const zip = new JSZip();

    // 1. Primary HTML
    zip.file('index.html', htmlInput);

    // 2. Plain Text Fallback
    let plainText = htmlInput
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<a\s+[^>]*href=["']([^"']+)["'][^>]*>(.*?)<\/a>/gi, '$2 [$1]')
      .replace(/<\/(div|p|h[1-6]|tr|li)>/gi, '\n')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/\n\s*\n/g, '\n\n')
      .trim();

    zip.file('email-fallback.txt', plainText);

    // 3. VML Snippets
    zip.file('vml-snippets.html', `<!-- Bulletproof VML Snippets for Outlook -->\n\n${generatedVmlButtonCode}\n\n${generatedVmlHeroCode}`);

    // 4. Campaign Manifest JSON
    const manifest = {
      subjectLine,
      preheaderText,
      senderName,
      senderEmail,
      outlookGuardActive: isOutlookGuardEnabled,
      spamScore,
      htmlByteSize,
      utmParameters: {
        source: utmSource,
        medium: utmMedium,
        campaign: utmCampaign,
        term: utmTerm,
        content: utmContent
      },
      exportedAt: new Date().toISOString()
    };

    zip.file('campaign-manifest.json', JSON.stringify(manifest, null, 2));

    const blob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = zipFileName ? `optimized_${zipFileName}` : 'newsletter_campaign_bundle.zip';
    a.click();
    URL.revokeObjectURL(url);
    copyToClipboard('', 'Exported production ZIP bundle with index.html, plain-text.txt & manifest!');
  };

  return (
    <div className="h-full w-full flex flex-col bg-[#FAFAFA] dark:bg-[#111111] text-black dark:text-white overflow-hidden">
      
      {/* Toast Notification */}
      {copiedNotification && (
        <div className="fixed top-12 left-1/2 -translate-x-1/2 z-[3000] bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-semibold shadow-2xl flex items-center gap-2">
          <CheckCircle2 size={16} /> {copiedNotification}
        </div>
      )}

      {/* Top Application Header */}
      <header className="flex-shrink-0 border-b border-black/10 dark:border-white/10 px-6 py-3 bg-white/80 dark:bg-[#18181B]/80 backdrop-blur-md flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-red-500 via-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-md">
            <Mail size={20} />
          </div>
          <div>
            <h1 className="font-bold text-base leading-tight flex items-center gap-2">
              Newsletter Studio &amp; E-Mail Forge
              <span className="text-[10px] uppercase tracking-wider font-semibold bg-red-500/10 text-red-600 dark:text-red-400 px-2 py-0.5 rounded-full border border-red-500/20">
                PRO MSO Engine
              </span>
            </h1>
            <p className="text-xs text-black/50 dark:text-white/50">
              Bulletproof MSO/Outlook HTML builder, VML vector generator &amp; BIMI simulator
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center bg-black/5 dark:bg-white/5 p-1 rounded-xl border border-black/5 dark:border-white/5 text-xs font-medium">
          <button 
            onClick={() => setActiveTab('editor')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${activeTab === 'editor' ? 'bg-white dark:bg-[#27272A] shadow-sm font-semibold text-black dark:text-white' : 'text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white'}`}
          >
            <Code2 size={14} /> HTML Code
          </button>
          <button 
            onClick={() => setActiveTab('preview')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${activeTab === 'preview' ? 'bg-white dark:bg-[#27272A] shadow-sm font-semibold text-black dark:text-white' : 'text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white'}`}
          >
            <Eye size={14} /> Live Preview
          </button>
          <button 
            onClick={() => setActiveTab('tools')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${activeTab === 'tools' ? 'bg-white dark:bg-[#27272A] shadow-sm font-semibold text-black dark:text-white' : 'text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white'}`}
          >
            <Wand2 size={14} /> MSO Power Tools
          </button>
          <button 
            onClick={() => setActiveTab('outlook_linter')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${activeTab === 'outlook_linter' ? 'bg-white dark:bg-[#27272A] shadow-sm font-semibold text-black dark:text-white' : 'text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white'}`}
          >
            <AlertTriangle size={14} className="text-amber-500" /> Outlook Linter ({outlookLintIssues.length})
          </button>
          <button 
            onClick={() => setActiveTab('vml_studio')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${activeTab === 'vml_studio' ? 'bg-white dark:bg-[#27272A] shadow-sm font-semibold text-black dark:text-white' : 'text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white'}`}
          >
            <Layers size={14} /> VML Studio
          </button>
          <button 
            onClick={() => setActiveTab('bimi_sim')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${activeTab === 'bimi_sim' ? 'bg-white dark:bg-[#27272A] shadow-sm font-semibold text-black dark:text-white' : 'text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white'}`}
          >
            <ShieldCheck size={14} /> Inbox &amp; BIMI Sim
          </button>
          <button 
            onClick={() => setActiveTab('spam_check')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${activeTab === 'spam_check' ? 'bg-white dark:bg-[#27272A] shadow-sm font-semibold text-black dark:text-white' : 'text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white'}`}
          >
            <ShieldAlert size={14} /> Deliverability &amp; Spam ({spamScore})
          </button>
          <button 
            onClick={() => setActiveTab('campaign_workflow')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${activeTab === 'campaign_workflow' ? 'bg-white dark:bg-[#27272A] shadow-sm font-semibold text-black dark:text-white' : 'text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white'}`}
          >
            <Zap size={14} className="text-red-500" /> Campaign &amp; Export
          </button>
        </div>

        {/* Action Export / Upload Buttons & Floating Outlook Guard */}
        <div className="flex items-center gap-2">
          {/* Floating Outlook Guard Toggle */}
          <button 
            onClick={handleApplyOutlookGuard}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold shadow-sm border flex items-center gap-1.5 transition-all ${
              isOutlookGuardEnabled 
                ? 'bg-blue-600/10 border-blue-500/30 text-blue-600 dark:text-blue-400 hover:bg-blue-600/20' 
                : 'bg-black/5 dark:bg-white/10 border-black/10 dark:border-white/10 text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white'
            }`}
            title="Automatically wraps table blocks with MSO conditional tags and 96 DPI scaling"
          >
            <ShieldCheck size={14} className={isOutlookGuardEnabled ? 'text-blue-500' : ''} />
            <span>Outlook Guard</span>
            <span className={`text-[9px] px-1.5 py-0.2 rounded font-mono ${isOutlookGuardEnabled ? 'bg-blue-600 text-white' : 'bg-black/20 dark:bg-white/20'}`}>
              {isOutlookGuardEnabled ? 'ON' : 'OFF'}
            </span>
          </button>

          <label className="cursor-pointer bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/15 px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all">
            <Upload size={14} /> Import ZIP
            <input type="file" accept=".zip" onChange={handleZipUpload} className="hidden" />
          </label>
          <button 
            onClick={handleExportZip}
            className="bg-red-600 hover:bg-red-500 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold shadow-md flex items-center gap-1.5 transition-all active:scale-95"
          >
            <Download size={14} /> Export ZIP / HTML
          </button>
        </div>
      </header>

      {/* Main Workspace Area */}
      <div className="flex-1 overflow-hidden p-4 flex flex-col xl:flex-row gap-4">
        
        {/* Left Side Panel: Subject, Preheader Padder, Template Presets, Real-time Warnings */}
        <aside className="w-full xl:w-80 flex-shrink-0 flex flex-col gap-4 overflow-y-auto custom-scrollbar pr-1">
          
          {/* Subject & Preheader Whitespace Padder Control Card */}
          <div className="bg-white dark:bg-[#18181B] border border-black/10 dark:border-white/10 rounded-2xl p-4 shadow-sm flex flex-col gap-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-black/60 dark:text-white/60 flex items-center justify-between">
              <span>Subject &amp; Preheader</span>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${subjectLine.length > 60 ? 'bg-amber-500/10 text-amber-600' : 'bg-emerald-500/10 text-emerald-600'}`}>
                {subjectLine.length} chars
              </span>
            </h2>

            <div>
              <label className="text-[11px] font-medium text-black/70 dark:text-white/70">Subject Line</label>
              <input 
                type="text" 
                value={subjectLine} 
                onChange={(e) => setSubjectLine(e.target.value)}
                placeholder="Subject line..."
                className="w-full mt-1 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl px-3 py-2 text-xs text-black dark:text-white focus:outline-none focus:border-red-500"
              />
            </div>

            <div>
              <label className="text-[11px] font-medium text-black/70 dark:text-white/70">Preheader Snippet</label>
              <input 
                type="text" 
                value={preheaderText} 
                onChange={(e) => setPreheaderText(e.target.value)}
                placeholder="Preview text in recipient inbox..."
                className="w-full mt-1 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl px-3 py-1.5 text-xs text-black dark:text-white focus:outline-none focus:border-red-500"
              />
            </div>

            {/* Preheader Whitespace Padder Explicit Opt-In Toggle */}
            <div className="p-2.5 bg-black/5 dark:bg-white/5 rounded-xl border border-black/5 dark:border-white/5 flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-xs font-bold text-black dark:text-white">Whitespace Padder</span>
                <span className="text-[10px] text-black/50 dark:text-white/50">Appends 120x &amp;nbsp;&amp;zwnj; to hide body text</span>
              </div>
              <button 
                onClick={() => setUseWhitespacePadder(!useWhitespacePadder)}
                className={`w-11 h-6 rounded-full transition-colors p-1 flex items-center ${useWhitespacePadder ? 'bg-red-600 justify-end' : 'bg-black/20 dark:bg-white/20 justify-start'}`}
              >
                <div className="w-4 h-4 rounded-full bg-white shadow-sm" />
              </button>
            </div>

            <button 
              onClick={handleInjectPreheader}
              className="w-full py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5"
            >
              <Sparkles size={14} /> Inject Preheader into HTML
            </button>
          </div>

          {/* Preset Templates Selector */}
          <div className="bg-white dark:bg-[#18181B] border border-black/10 dark:border-white/10 rounded-2xl p-4 shadow-sm flex flex-col gap-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-black/60 dark:text-white/60">
              Template Presets
            </h2>
            <div className="grid grid-cols-1 gap-2 text-xs">
              <button 
                onClick={() => setHtmlInput(PRESET_TEMPLATES.promo)}
                className="p-2.5 rounded-xl border border-black/10 dark:border-white/10 text-left hover:bg-black/5 dark:hover:bg-white/5 transition-all flex items-center justify-between"
              >
                <div>
                  <div className="font-bold text-black dark:text-white">Promotional / Announcement</div>
                  <div className="text-[10px] text-black/50 dark:text-white/50">Full hero, bulletproof CTA &amp; footer</div>
                </div>
                <Zap size={14} className="text-red-500" />
              </button>

              <button 
                onClick={() => setHtmlInput(PRESET_TEMPLATES.weekly)}
                className="p-2.5 rounded-xl border border-black/10 dark:border-white/10 text-left hover:bg-black/5 dark:hover:bg-white/5 transition-all flex items-center justify-between"
              >
                <div>
                  <div className="font-bold text-black dark:text-white">Weekly Editorial Digest</div>
                  <div className="text-[10px] text-black/50 dark:text-white/50">Clean article grid &amp; read links</div>
                </div>
                <FileText size={14} className="text-blue-500" />
              </button>

              <button 
                onClick={() => setHtmlInput(PRESET_TEMPLATES.transactional)}
                className="p-2.5 rounded-xl border border-black/10 dark:border-white/10 text-left hover:bg-black/5 dark:hover:bg-white/5 transition-all flex items-center justify-between"
              >
                <div>
                  <div className="font-bold text-black dark:text-white">Transactional Receipt</div>
                  <div className="text-[10px] text-black/50 dark:text-white/50">Order summary table &amp; total</div>
                </div>
                <FileCheck size={14} className="text-emerald-500" />
              </button>
            </div>
          </div>

          {/* Audit & Compatibility Warnings */}
          <div className="bg-white dark:bg-[#18181B] border border-black/10 dark:border-white/10 rounded-2xl p-4 shadow-sm flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-black/60 dark:text-white/60 flex items-center gap-1.5">
                <AlertTriangle size={14} className="text-amber-500" /> MSO Compatibility Audit
              </h2>
              <span className="text-[10px] font-bold text-black/40 dark:text-white/40">
                {(htmlByteSize / 1024).toFixed(1)} KB
              </span>
            </div>

            {auditIssues.length === 0 ? (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-xl text-xs flex items-center gap-2 font-medium">
                <CheckCircle2 size={16} /> All email compatibility checks passed!
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {auditIssues.map((issue, idx) => (
                  <div 
                    key={idx} 
                    className={`p-2.5 rounded-xl border text-xs ${
                      issue.level === 'error' 
                        ? 'bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400' 
                        : issue.level === 'warning'
                        ? 'bg-amber-500/10 border-amber-500/20 text-amber-700 dark:text-amber-400'
                        : 'bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400'
                    }`}
                  >
                    <div className="font-bold leading-tight">{issue.title}</div>
                    <div className="text-[11px] opacity-80 mt-0.5">{issue.desc}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </aside>

        {/* Center Main Editor / View Container */}
        <main className="flex-1 flex flex-col min-w-0 bg-white dark:bg-[#18181B] border border-black/10 dark:border-white/10 rounded-2xl overflow-hidden shadow-sm">
          
          {/* Tab 1: Raw HTML Code Editor */}
          {activeTab === 'editor' && (
            <div className="h-full flex flex-col">
              <div className="px-4 py-2.5 bg-black/5 dark:bg-white/5 border-b border-black/10 dark:border-white/10 flex items-center justify-between text-xs">
                <span className="font-bold text-black/70 dark:text-white/70 flex items-center gap-1.5">
                  <FileCode size={14} /> E-Mail HTML Editor
                </span>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={handleFormatHtml}
                    className="px-2.5 py-1 rounded-lg bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/15 text-xs font-semibold transition-all"
                  >
                    Format HTML
                  </button>
                  <button 
                    onClick={() => copyToClipboard(htmlInput, 'HTML copied!')}
                    className="px-2.5 py-1 rounded-lg bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/15 text-xs font-semibold transition-all flex items-center gap-1"
                  >
                    <Copy size={12} /> Copy Code
                  </button>
                </div>
              </div>

              <textarea 
                value={htmlInput}
                onChange={(e) => setHtmlInput(e.target.value)}
                placeholder="Paste or write email HTML here..."
                className="flex-1 p-4 bg-[#1e1e24] text-emerald-400 font-mono text-xs focus:outline-none resize-none leading-relaxed custom-scrollbar"
                spellCheck={false}
              />
            </div>
          )}

          {/* Tab 2: Multi-Client Virtualized Preview Component */}
          {activeTab === 'preview' && (
            <div className="h-full flex flex-col">
              <div className="px-4 py-2.5 bg-black/5 dark:bg-white/5 border-b border-black/10 dark:border-white/10 flex flex-wrap items-center justify-between gap-2 text-xs">
                {/* Virtualized Frame Selector */}
                <div className="flex items-center gap-1.5 overflow-x-auto">
                  <span className="font-bold text-black/50 dark:text-white/50 text-[10px] uppercase tracking-wider mr-1">Device Frame:</span>
                  <button 
                    onClick={() => { setClientDeviceFrame('iphone15'); setPreviewDevice('mobile'); }}
                    className={`px-2.5 py-1 rounded-lg flex items-center gap-1 transition-all ${clientDeviceFrame === 'iphone15' ? 'bg-red-600 text-white font-bold' : 'bg-black/5 dark:bg-white/10 text-black/70 dark:text-white/70'}`}
                  >
                    <Smartphone size={13} /> iPhone 15 Pro
                  </button>
                  <button 
                    onClick={() => { setClientDeviceFrame('pixel8'); setPreviewDevice('mobile'); }}
                    className={`px-2.5 py-1 rounded-lg flex items-center gap-1 transition-all ${clientDeviceFrame === 'pixel8' ? 'bg-red-600 text-white font-bold' : 'bg-black/5 dark:bg-white/10 text-black/70 dark:text-white/70'}`}
                  >
                    <Smartphone size={13} /> Pixel 8
                  </button>
                  <button 
                    onClick={() => { setClientDeviceFrame('outlook365'); setPreviewDevice('desktop'); }}
                    className={`px-2.5 py-1 rounded-lg flex items-center gap-1 transition-all ${clientDeviceFrame === 'outlook365' ? 'bg-blue-600 text-white font-bold' : 'bg-black/5 dark:bg-white/10 text-black/70 dark:text-white/70'}`}
                  >
                    <Monitor size={13} /> Outlook 365
                  </button>
                  <button 
                    onClick={() => { setClientDeviceFrame('gmail_web'); setPreviewDevice('desktop'); }}
                    className={`px-2.5 py-1 rounded-lg flex items-center gap-1 transition-all ${clientDeviceFrame === 'gmail_web' ? 'bg-red-600 text-white font-bold' : 'bg-black/5 dark:bg-white/10 text-black/70 dark:text-white/70'}`}
                  >
                    <Code2 size={13} /> Gmail Web
                  </button>
                  <button 
                    onClick={() => { setClientDeviceFrame('apple_mail'); setPreviewDevice('desktop'); }}
                    className={`px-2.5 py-1 rounded-lg flex items-center gap-1 transition-all ${clientDeviceFrame === 'apple_mail' ? 'bg-gray-800 text-white font-bold' : 'bg-black/5 dark:bg-white/10 text-black/70 dark:text-white/70'}`}
                  >
                    <Monitor size={13} /> Apple Mail
                  </button>
                </div>

                {/* CSS Engine Simulator Toggle */}
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setSimulatedCssEngine(simulatedCssEngine === 'standard' ? 'outlook_mso' : 'standard')}
                    className={`px-2.5 py-1 rounded-lg flex items-center gap-1 font-bold transition-all ${
                      simulatedCssEngine === 'outlook_mso' 
                        ? 'bg-amber-500 text-black' 
                        : 'bg-black/5 dark:bg-white/10 text-black/70 dark:text-white/70'
                    }`}
                    title="Simulates Word HTML rendering quirks (strips border-radius & box-shadow)"
                  >
                    <AlertTriangle size={13} />
                    {simulatedCssEngine === 'outlook_mso' ? 'MSO Engine Active' : 'Standard Web CSS'}
                  </button>

                  <button 
                    onClick={() => setIsPreviewDarkMode(!isPreviewDarkMode)}
                    className="px-2.5 py-1 rounded-lg bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/15 flex items-center gap-1 font-semibold transition-all"
                  >
                    {isPreviewDarkMode ? <Sun size={13} className="text-amber-400" /> : <Moon size={13} />}
                    {isPreviewDarkMode ? 'Light' : 'Dark'}
                  </button>
                </div>
              </div>

              {/* Main Virtualized Device Frame Area */}
              <div className={`flex-1 overflow-auto p-6 flex flex-col justify-start items-center ${isPreviewDarkMode ? 'bg-[#0f0f12]' : 'bg-[#e2e8f0]'}`}>
                
                {/* MSO Engine Notice Banner */}
                {simulatedCssEngine === 'outlook_mso' && (
                  <div className="mb-4 px-4 py-2 bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 rounded-xl text-xs font-semibold flex items-center gap-2">
                    <AlertTriangle size={15} /> Word HTML Rendering Simulation Active: Non-VML rounded corners &amp; CSS shadows disabled to mirror Word 2007-2021 behavior.
                  </div>
                )}

                {/* 1. iPhone 15 Pro Frame */}
                {clientDeviceFrame === 'iphone15' && (
                  <div className="w-[393px] bg-black p-3.5 rounded-[50px] shadow-2xl border-4 border-gray-800 flex flex-col relative my-2">
                    {/* Dynamic Island */}
                    <div className="w-28 h-7 bg-black rounded-full mx-auto mb-2 flex items-center justify-between px-3 z-20 shadow-inner">
                      <div className="w-2.5 h-2.5 rounded-full bg-blue-900/60" />
                      <div className="w-2 h-2 rounded-full bg-green-500/80" />
                    </div>
                    
                    {/* iOS Status Bar */}
                    <div className="flex justify-between items-center text-[11px] font-semibold text-gray-400 px-4 mb-2">
                      <span>9:41</span>
                      <div className="flex items-center gap-1 text-[10px]">
                        <span>5G</span>
                        <div className="w-5 h-2.5 border border-gray-400 rounded-sm p-0.5 flex justify-end">
                          <div className="w-full h-full bg-white rounded-xs" />
                        </div>
                      </div>
                    </div>

                    {/* Email Content Canvas */}
                    <div className="bg-white rounded-[32px] overflow-hidden min-h-[640px] max-h-[720px] flex flex-col">
                      <div className="bg-gray-100 px-4 py-2 border-b text-xs flex items-center justify-between font-semibold text-gray-700">
                        <span className="truncate">{subjectLine}</span>
                        <span className="text-[10px] text-gray-500">iOS Mail</span>
                      </div>
                      <iframe 
                        srcDoc={simulatedCssEngine === 'outlook_mso' ? htmlInput.replace(/border-radius:[^;]+;/gi, '').replace(/box-shadow:[^;]+;/gi, '') : htmlInput}
                        title="iPhone 15 Email Preview"
                        className="w-full flex-1 border-none bg-white"
                        style={{ filter: isPreviewDarkMode ? 'invert(0.9) hue-rotate(180deg)' : 'none' }}
                      />
                    </div>
                  </div>
                )}

                {/* 2. Pixel 8 Frame */}
                {clientDeviceFrame === 'pixel8' && (
                  <div className="w-[412px] bg-gray-900 p-3 rounded-[40px] shadow-2xl border-4 border-gray-700 flex flex-col relative my-2">
                    {/* Punch Hole Camera */}
                    <div className="w-4 h-4 bg-black rounded-full mx-auto mb-2 shadow-inner" />
                    
                    {/* Android Status Bar */}
                    <div className="flex justify-between items-center text-[10px] font-semibold text-gray-400 px-4 mb-2">
                      <span>10:00</span>
                      <span>LTE • 98%</span>
                    </div>

                    {/* Email Canvas */}
                    <div className="bg-white rounded-[28px] overflow-hidden min-h-[640px] max-h-[720px] flex flex-col">
                      <div className="bg-red-600 text-white px-4 py-2 text-xs flex items-center justify-between font-bold">
                        <span className="truncate">Gmail Android</span>
                        <span className="text-[10px] opacity-80">Pixel 8</span>
                      </div>
                      <iframe 
                        srcDoc={simulatedCssEngine === 'outlook_mso' ? htmlInput.replace(/border-radius:[^;]+;/gi, '').replace(/box-shadow:[^;]+;/gi, '') : htmlInput}
                        title="Pixel 8 Email Preview"
                        className="w-full flex-1 border-none bg-white"
                        style={{ filter: isPreviewDarkMode ? 'invert(0.9) hue-rotate(180deg)' : 'none' }}
                      />
                    </div>
                  </div>
                )}

                {/* 3. Outlook 365 Desktop Frame */}
                {clientDeviceFrame === 'outlook365' && (
                  <div className="w-[680px] bg-white dark:bg-[#1f1f23] rounded-2xl shadow-2xl border border-black/10 overflow-hidden flex flex-col my-2">
                    {/* Outlook Ribbon Toolbar */}
                    <div className="bg-[#0078d4] text-white px-4 py-2 flex items-center justify-between text-xs font-bold">
                      <div className="flex items-center gap-2">
                        <Monitor size={14} />
                        <span>Microsoft Outlook 365 (Word Engine Rendering)</span>
                      </div>
                      <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded">MSO Word Engine</span>
                    </div>

                    {/* Message Header */}
                    <div className="bg-gray-50 dark:bg-[#27272a] p-3 border-b text-xs flex flex-col gap-1">
                      <div className="font-bold text-gray-900 dark:text-gray-100">{subjectLine}</div>
                      <div className="text-gray-500 dark:text-gray-400 text-[11px]">
                        From: <span className="font-semibold">{senderName}</span> &lt;{senderEmail}&gt;
                      </div>
                    </div>

                    <iframe 
                      srcDoc={simulatedCssEngine === 'outlook_mso' ? htmlInput.replace(/border-radius:[^;]+;/gi, '').replace(/box-shadow:[^;]+;/gi, '') : htmlInput}
                      title="Outlook 365 Preview"
                      className="w-full h-[650px] border-none bg-white"
                      style={{ filter: isPreviewDarkMode ? 'invert(0.9) hue-rotate(180deg)' : 'none' }}
                    />
                  </div>
                )}

                {/* 4. Gmail Web Frame */}
                {clientDeviceFrame === 'gmail_web' && (
                  <div className="w-[780px] bg-white dark:bg-[#18181b] rounded-2xl shadow-2xl border border-black/10 overflow-hidden flex flex-col my-2">
                    {/* Gmail Browser Bar */}
                    <div className="bg-gray-100 dark:bg-[#27272a] px-4 py-2 border-b flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 text-red-600 font-bold">
                        <Mail size={16} /> Gmail Web Application
                      </div>
                      <div className="text-[11px] text-gray-500">https://mail.google.com</div>
                    </div>

                    {/* Email Title Header */}
                    <div className="p-4 border-b flex items-center justify-between bg-white dark:bg-[#18181b]">
                      <div>
                        <h3 className="font-bold text-sm text-gray-900 dark:text-white">{subjectLine}</h3>
                        <p className="text-xs text-gray-500 mt-0.5">{senderName} &lt;{senderEmail}&gt;</p>
                      </div>
                      <span className="text-xs text-gray-400">10:42 AM</span>
                    </div>

                    <iframe 
                      srcDoc={simulatedCssEngine === 'outlook_mso' ? htmlInput.replace(/border-radius:[^;]+;/gi, '').replace(/box-shadow:[^;]+;/gi, '') : htmlInput}
                      title="Gmail Web Preview"
                      className="w-full h-[650px] border-none bg-white"
                      style={{ filter: isPreviewDarkMode ? 'invert(0.9) hue-rotate(180deg)' : 'none' }}
                    />
                  </div>
                )}

                {/* 5. Apple Mail macOS Frame */}
                {clientDeviceFrame === 'apple_mail' && (
                  <div className="w-[720px] bg-white dark:bg-[#18181b] rounded-2xl shadow-2xl border border-black/10 overflow-hidden flex flex-col my-2">
                    {/* macOS Toolbar Header */}
                    <div className="bg-gray-200 dark:bg-[#27272a] px-4 py-2 border-b flex items-center gap-2 text-xs">
                      <div className="w-3 h-3 rounded-full bg-red-500" />
                      <div className="w-3 h-3 rounded-full bg-amber-500" />
                      <div className="w-3 h-3 rounded-full bg-green-500" />
                      <span className="font-semibold text-gray-700 dark:text-gray-300 ml-2">Apple Mail — {subjectLine}</span>
                    </div>

                    <iframe 
                      srcDoc={simulatedCssEngine === 'outlook_mso' ? htmlInput.replace(/border-radius:[^;]+;/gi, '').replace(/box-shadow:[^;]+;/gi, '') : htmlInput}
                      title="Apple Mail Preview"
                      className="w-full h-[650px] border-none bg-white"
                      style={{ filter: isPreviewDarkMode ? 'invert(0.9) hue-rotate(180deg)' : 'none' }}
                    />
                  </div>
                )}

              </div>
            </div>
          )}

          {/* Tab 3: MSO Power Tools Suite */}
          {activeTab === 'tools' && (
            <div className="h-full p-6 overflow-y-auto custom-scrollbar flex flex-col gap-6">
              <div>
                <h2 className="text-base font-bold text-black dark:text-white flex items-center gap-2">
                  <Wand2 className="text-red-500" size={18} /> Outlook MSO Power Tools
                </h2>
                <p className="text-xs text-black/60 dark:text-white/60">
                  One-click explicit opt-in tools for Outlook 2007-2021 compatibility, DPI scaling, and CSS inlining.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                
                {/* 1. MSO Ghost Table Generator */}
                <div className="p-4 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 flex flex-col justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-sm text-black dark:text-white flex items-center gap-1.5">
                      <Grid size={16} className="text-purple-500" /> MSO Ghost Table Generator
                    </h3>
                    <p className="text-xs text-black/60 dark:text-white/60 mt-1">
                      Wraps responsive containers with conditional comments <code className="text-red-500">&lt;!--[if mso]&gt;&lt;table width="600"&gt;</code> to prevent layout blowouts.
                    </p>
                  </div>
                  <button 
                    onClick={handleInjectMsoGhostTables}
                    className="w-full py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
                  >
                    Inject MSO Ghost Tables
                  </button>
                </div>

                {/* 2. DPI Scaling & o:PixelsPerInch Auto-Fixer */}
                <div className="p-4 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 flex flex-col justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-sm text-black dark:text-white flex items-center gap-1.5">
                      <Sliders size={16} className="text-indigo-500" /> 96 DPI Scaling Auto-Fixer
                    </h3>
                    <p className="text-xs text-black/60 dark:text-white/60 mt-1">
                      Injects <code className="text-indigo-500">&lt;o:PixelsPerInch&gt;96&lt;/o:PixelsPerInch&gt;</code> XML meta to stop Windows 120 DPI screen rendering distortion.
                    </p>
                  </div>
                  <button 
                    onClick={handleInjectDpiFix}
                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
                  >
                    Inject 96 DPI Office Meta
                  </button>
                </div>

                {/* 3. Automatic CSS Inliner */}
                <div className="p-4 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 flex flex-col justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-sm text-black dark:text-white flex items-center gap-1.5">
                      <Code2 size={16} className="text-blue-500" /> Automatic CSS Inliner
                    </h3>
                    <p className="text-xs text-black/60 dark:text-white/60 mt-1">
                      Converts internal style blocks directly into inline style attributes for maximum client support.
                    </p>
                  </div>
                  <button 
                    onClick={handleInlineCss}
                    className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all"
                  >
                    Inline CSS Now
                  </button>
                </div>

                {/* 4. Outlook Table Sanitizer */}
                <div className="p-4 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 flex flex-col justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-sm text-black dark:text-white flex items-center gap-1.5">
                      <FileCheck size={16} className="text-emerald-500" /> Outlook Table Sanitizer
                    </h3>
                    <p className="text-xs text-black/60 dark:text-white/60 mt-1">
                      Ensures all table elements have border="0", cellpadding="0", cellspacing="0", and role="presentation".
                    </p>
                  </div>
                  <button 
                    onClick={handleFixTables}
                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all"
                  >
                    Sanitize Tables
                  </button>
                </div>

                {/* 5. Image Display:Block & Alt Fixer */}
                <div className="p-4 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 flex flex-col justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-sm text-black dark:text-white flex items-center gap-1.5">
                      <Zap size={16} className="text-amber-500" /> Gmail Image Gap Fixer
                    </h3>
                    <p className="text-xs text-black/60 dark:text-white/60 mt-1">
                      Applies style="display:block; border:0;" and missing alt attributes to eliminate whitespace gaps.
                    </p>
                  </div>
                  <button 
                    onClick={handleFixImages}
                    className="w-full py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold transition-all"
                  >
                    Fix Image Gaps
                  </button>
                </div>

                {/* 6. Dark Mode Meta Injector */}
                <div className="p-4 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 flex flex-col justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-sm text-black dark:text-white flex items-center gap-1.5">
                      <Moon size={16} className="text-purple-500" /> Dark Mode Email Optimizer
                    </h3>
                    <p className="text-xs text-black/60 dark:text-white/60 mt-1">
                      Injects color-scheme light dark meta tags and dark media query overrides into head.
                    </p>
                  </div>
                  <button 
                    onClick={handleInjectDarkModeMeta}
                    className="w-full py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition-all"
                  >
                    Inject Dark Mode Tags
                  </button>
                </div>

                {/* 7. Flexbox / CSS Grid to Table Transpiler */}
                <div className="p-4 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 flex flex-col justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-sm text-black dark:text-white flex items-center gap-1.5">
                      <Layers size={16} className="text-red-500" /> Flexbox / Grid to Table Transpiler
                    </h3>
                    <p className="text-xs text-black/60 dark:text-white/60 mt-1">
                      Converts unsupported display: flex or display: grid into email-safe nested HTML &lt;table&gt; cells.
                    </p>
                  </div>
                  <button 
                    onClick={handleTranspileFlexToTables}
                    className="w-full py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
                  >
                    Transpile Flex/Grid to Tables
                  </button>
                </div>

              </div>

              {/* Smart Link Replacer & UTM Append */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-black/10 dark:border-white/10">
                {/* Link Replacer */}
                <div className="p-4 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 flex flex-col gap-3">
                  <h3 className="font-bold text-sm text-black dark:text-white flex items-center gap-1.5">
                    <LinkIcon size={16} className="text-red-500" /> Smart Link Batch Replacer
                  </h3>
                  <p className="text-xs text-black/60 dark:text-white/60">
                    Replaces all standard URLs with ESP placeholder variables (e.g., {"{{link}}"}, *|UNSUB|*).
                  </p>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      value={smartLinkTarget} 
                      onChange={(e) => setSmartLinkTarget(e.target.value)}
                      placeholder="{{link}}"
                      className="flex-1 bg-white dark:bg-[#111] border border-black/10 dark:border-white/10 rounded-xl px-3 py-1.5 text-xs focus:outline-none"
                    />
                    <button 
                      onClick={handleReplaceLinks}
                      className="px-4 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold transition-all"
                    >
                      Replace
                    </button>
                  </div>
                </div>

                {/* UTM Parameter Appender */}
                <div className="p-4 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 flex flex-col gap-3">
                  <h3 className="font-bold text-sm text-black dark:text-white flex items-center gap-1.5">
                    <ExternalLink size={16} className="text-emerald-500" /> Append UTM Tracking Parameters
                  </h3>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <input 
                      type="text" 
                      value={utmSource} 
                      onChange={(e) => setUtmSource(e.target.value)}
                      placeholder="utm_source" 
                      className="bg-white dark:bg-[#111] border border-black/10 dark:border-white/10 rounded-xl px-2.5 py-1.5 focus:outline-none"
                    />
                    <input 
                      type="text" 
                      value={utmMedium} 
                      onChange={(e) => setUtmMedium(e.target.value)}
                      placeholder="utm_medium" 
                      className="bg-white dark:bg-[#111] border border-black/10 dark:border-white/10 rounded-xl px-2.5 py-1.5 focus:outline-none"
                    />
                    <input 
                      type="text" 
                      value={utmCampaign} 
                      onChange={(e) => setUtmCampaign(e.target.value)}
                      placeholder="utm_campaign" 
                      className="bg-white dark:bg-[#111] border border-black/10 dark:border-white/10 rounded-xl px-2.5 py-1.5 focus:outline-none"
                    />
                  </div>
                  <button 
                    onClick={handleAppendUtm}
                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all"
                  >
                    Append UTM Params to All Links
                  </button>
                </div>
              </div>

            </div>
          )}

          {/* Tab 4: Outlook CSS Support Linter */}
          {activeTab === 'outlook_linter' && (
            <div className="h-full p-6 overflow-y-auto custom-scrollbar flex flex-col gap-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-black dark:text-white flex items-center gap-2">
                    <AlertTriangle className="text-amber-500" size={18} /> Outlook CSS Support Real-Time Linter
                  </h2>
                  <p className="text-xs text-black/60 dark:text-white/60 mt-0.5">
                    Scans HTML for unsupported CSS properties in Word rendering engine (Outlook 2007, 2010, 2013, 2016, 2019, 2021).
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 border border-amber-500/20">
                    {outlookLintIssues.length} issue(s) detected
                  </span>
                </div>
              </div>

              {outlookLintIssues.length === 0 ? (
                <div className="p-6 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex flex-col items-center justify-center text-center gap-2">
                  <CheckCircle2 size={32} className="text-emerald-500" />
                  <h3 className="font-bold text-sm text-emerald-600 dark:text-emerald-400">100% Outlook CSS Compatible!</h3>
                  <p className="text-xs text-emerald-600/80 dark:text-emerald-400/80 max-w-md">
                    No unsupported CSS properties (max-width, flexbox, border-radius, box-shadow, position) were detected in your HTML template.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {outlookLintIssues.map((issue, idx) => (
                    <div 
                      key={idx} 
                      className={`p-4 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                        issue.severity === 'error' 
                          ? 'bg-red-500/5 border-red-500/20 text-red-700 dark:text-red-400' 
                          : issue.severity === 'warning'
                          ? 'bg-amber-500/5 border-amber-500/20 text-amber-700 dark:text-amber-400'
                          : 'bg-blue-500/5 border-blue-500/20 text-blue-700 dark:text-blue-400'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-xl flex-shrink-0 ${issue.severity === 'error' ? 'bg-red-500 text-white' : issue.severity === 'warning' ? 'bg-amber-500 text-white' : 'bg-blue-500 text-white'}`}>
                          <AlertTriangle size={18} />
                        </div>
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2 font-bold text-sm text-black dark:text-white">
                            <span>Unsupported CSS: <code className="px-1.5 py-0.5 rounded bg-black/10 dark:bg-white/10 font-mono text-xs">{issue.property}</code></span>
                            <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10">
                              {issue.tagOrSelector}
                            </span>
                          </div>
                          <p className="text-xs opacity-90">{issue.reason}</p>
                          <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1">
                            💡 Fix Suggestion: {issue.suggestion}
                          </p>
                        </div>
                      </div>

                      {issue.property.includes('flex') || issue.property.includes('grid') ? (
                        <button 
                          onClick={handleTranspileFlexToTables}
                          className="px-3.5 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold transition-all flex-shrink-0"
                        >
                          Auto-Transpile to Tables
                        </button>
                      ) : issue.property.includes('max-width') ? (
                        <button 
                          onClick={handleInjectMsoGhostTables}
                          className="px-3.5 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition-all flex-shrink-0"
                        >
                          Inject Ghost Table
                        </button>
                      ) : null}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tab 5: VML Vector Button & Background Hero Studio */}
          {activeTab === 'vml_studio' && (
            <div className="h-full p-6 overflow-y-auto custom-scrollbar flex flex-col gap-8">
              <div>
                <h2 className="text-base font-bold text-black dark:text-white flex items-center gap-2">
                  <Layers className="text-red-500" size={18} /> VML Vector Button &amp; Hero Background Studio
                </h2>
                <p className="text-xs text-black/60 dark:text-white/60">
                  Outlook Desktop completely ignores standard CSS padding on <code className="text-red-500">&lt;a&gt;</code> tags and CSS background images. Use vector VML shapes for 100% pixel-perfect rendering.
                </p>
              </div>

              {/* Section 1: Bulletproof VML Button Generator */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 bg-black/5 dark:bg-white/5 p-5 rounded-2xl border border-black/5 dark:border-white/5">
                <div className="flex flex-col gap-4">
                  <h3 className="font-bold text-sm text-black dark:text-white flex items-center gap-2">
                    <Zap className="text-amber-500" size={16} /> VML Roundrect Button Controls
                  </h3>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="font-semibold text-black/70 dark:text-white/70">Button Label</label>
                      <input type="text" value={vmlText} onChange={(e) => setVmlText(e.target.value)} className="w-full mt-1 bg-white dark:bg-[#111] border border-black/10 dark:border-white/10 rounded-xl px-3 py-1.5" />
                    </div>
                    <div>
                      <label className="font-semibold text-black/70 dark:text-white/70">Target URL</label>
                      <input type="text" value={vmlUrl} onChange={(e) => setVmlUrl(e.target.value)} className="w-full mt-1 bg-white dark:bg-[#111] border border-black/10 dark:border-white/10 rounded-xl px-3 py-1.5" />
                    </div>
                    <div>
                      <label className="font-semibold text-black/70 dark:text-white/70">Background Color</label>
                      <div className="flex gap-2 mt-1 items-center">
                        <input type="color" value={vmlBgColor} onChange={(e) => setVmlBgColor(e.target.value)} className="w-8 h-8 rounded-lg cursor-pointer" />
                        <input type="text" value={vmlBgColor} onChange={(e) => setVmlBgColor(e.target.value)} className="flex-1 bg-white dark:bg-[#111] border border-black/10 dark:border-white/10 rounded-xl px-2 py-1" />
                      </div>
                    </div>
                    <div>
                      <label className="font-semibold text-black/70 dark:text-white/70">Text Color</label>
                      <div className="flex gap-2 mt-1 items-center">
                        <input type="color" value={vmlTextColor} onChange={(e) => setVmlTextColor(e.target.value)} className="w-8 h-8 rounded-lg cursor-pointer" />
                        <input type="text" value={vmlTextColor} onChange={(e) => setVmlTextColor(e.target.value)} className="flex-1 bg-white dark:bg-[#111] border border-black/10 dark:border-white/10 rounded-xl px-2 py-1" />
                      </div>
                    </div>
                    <div>
                      <label className="font-semibold text-black/70 dark:text-white/70">Width ({vmlWidth}px)</label>
                      <input type="range" min={100} max={400} value={vmlWidth} onChange={(e) => setVmlWidth(Number(e.target.value))} className="w-full mt-2" />
                    </div>
                    <div>
                      <label className="font-semibold text-black/70 dark:text-white/70">Height ({vmlHeight}px)</label>
                      <input type="range" min={30} max={80} value={vmlHeight} onChange={(e) => setVmlHeight(Number(e.target.value))} className="w-full mt-2" />
                    </div>
                  </div>

                  {/* Live Visual Button Preview */}
                  <div className="p-6 bg-white dark:bg-[#111] rounded-2xl border border-black/10 dark:border-white/10 flex flex-col items-center justify-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-black/40 dark:text-white/40">Visual Preview</span>
                    <div 
                      style={{ 
                        width: `${vmlWidth}px`, 
                        height: `${vmlHeight}px`, 
                        backgroundColor: vmlBgColor, 
                        color: vmlTextColor, 
                        borderRadius: `${vmlRadius}px` 
                      }} 
                      className="flex items-center justify-center font-bold text-sm shadow-md transition-all cursor-pointer"
                    >
                      {vmlText}
                    </div>
                  </div>
                </div>

                {/* VML Code Output */}
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-black/60 dark:text-white/60">Generated VML Code</span>
                    <div className="flex gap-2">
                      <button onClick={() => insertIntoEditor(generatedVmlButtonCode, 'VML Button')} className="px-2.5 py-1 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-bold transition-all">
                        Insert in Editor
                      </button>
                      <button onClick={() => copyToClipboard(generatedVmlButtonCode, 'VML Button code copied!')} className="px-2.5 py-1 bg-black/10 dark:bg-white/10 hover:bg-black/20 text-xs font-semibold rounded-lg">
                        Copy Code
                      </button>
                    </div>
                  </div>

                  <textarea 
                    readOnly 
                    value={generatedVmlButtonCode} 
                    className="flex-1 p-3 bg-[#1e1e24] text-emerald-400 font-mono text-[11px] rounded-xl border border-black/10 focus:outline-none min-h-[220px]" 
                  />
                </div>
              </div>

              {/* Section 2: VML Hero Background Image Generator */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 bg-black/5 dark:bg-white/5 p-5 rounded-2xl border border-black/5 dark:border-white/5">
                <div className="flex flex-col gap-4">
                  <h3 className="font-bold text-sm text-black dark:text-white flex items-center gap-2">
                    <ImageIcon className="text-purple-500" size={16} /> VML Hero Background Image Generator
                  </h3>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="col-span-2">
                      <label className="font-semibold text-black/70 dark:text-white/70">Background Image URL</label>
                      <input type="text" value={vmlBgImgUrl} onChange={(e) => setVmlBgImgUrl(e.target.value)} className="w-full mt-1 bg-white dark:bg-[#111] border border-black/10 dark:border-white/10 rounded-xl px-3 py-1.5" />
                    </div>
                    <div>
                      <label className="font-semibold text-black/70 dark:text-white/70">Hero Title</label>
                      <input type="text" value={vmlBgContentTitle} onChange={(e) => setVmlBgContentTitle(e.target.value)} className="w-full mt-1 bg-white dark:bg-[#111] border border-black/10 dark:border-white/10 rounded-xl px-3 py-1.5" />
                    </div>
                    <div>
                      <label className="font-semibold text-black/70 dark:text-white/70">Fallback Color</label>
                      <div className="flex gap-2 mt-1 items-center">
                        <input type="color" value={vmlBgColorFallback} onChange={(e) => setVmlBgColorFallback(e.target.value)} className="w-8 h-8 rounded-lg cursor-pointer" />
                        <input type="text" value={vmlBgColorFallback} onChange={(e) => setVmlBgColorFallback(e.target.value)} className="flex-1 bg-white dark:bg-[#111] border border-black/10 dark:border-white/10 rounded-xl px-2 py-1" />
                      </div>
                    </div>
                  </div>

                  {/* Visual Background Box Preview */}
                  <div 
                    style={{ 
                      backgroundImage: `url(${vmlBgImgUrl})`, 
                      backgroundColor: vmlBgColorFallback,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      height: '160px'
                    }} 
                    className="w-full rounded-2xl shadow-md border border-black/10 flex flex-col items-center justify-center p-4 text-white text-center"
                  >
                    <h2 className="font-bold text-lg drop-shadow-md">{vmlBgContentTitle}</h2>
                    <p className="text-xs opacity-90 mt-1">100% Outlook VML Vector Fill Compatible</p>
                  </div>
                </div>

                {/* VML Background Code Output */}
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-black/60 dark:text-white/60">Generated VML Background</span>
                    <div className="flex gap-2">
                      <button onClick={() => insertIntoEditor(generatedVmlHeroCode, 'VML Hero Background')} className="px-2.5 py-1 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-bold transition-all">
                        Insert in Editor
                      </button>
                      <button onClick={() => copyToClipboard(generatedVmlHeroCode, 'VML Background code copied!')} className="px-2.5 py-1 bg-black/10 dark:bg-white/10 hover:bg-black/20 text-xs font-semibold rounded-lg">
                        Copy Code
                      </button>
                    </div>
                  </div>

                  <textarea 
                    readOnly 
                    value={generatedVmlHeroCode} 
                    className="flex-1 p-3 bg-[#1e1e24] text-emerald-400 font-mono text-[11px] rounded-xl border border-black/10 focus:outline-none min-h-[220px]" 
                  />
                </div>
              </div>

            </div>
          )}

          {/* Tab 5: Dynamic Subject Line Cutoff & BIMI Sender Simulator */}
          {activeTab === 'bimi_sim' && (
            <div className="h-full p-6 overflow-y-auto custom-scrollbar flex flex-col gap-8">
              
              {/* Section 1: Dynamic Subject Line Tester across 4 major clients */}
              <div className="flex flex-col gap-4">
                <div>
                  <h2 className="text-base font-bold text-black dark:text-white flex items-center gap-2">
                    <Smartphone className="text-blue-500" size={18} /> Dynamic Subject Line &amp; Cutoff Tester
                  </h2>
                  <p className="text-xs text-black/60 dark:text-white/60">
                    Real-time character truncation tester across major email clients before sending.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* iOS Mail */}
                  <div className="p-4 bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-2xl flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-black dark:text-white flex items-center gap-1.5">
                        <Smartphone size={14} className="text-blue-500" /> Apple Mail iOS (iPhone)
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600">
                        ~38 Chars Max
                      </span>
                    </div>
                    <div className="p-3 bg-white dark:bg-[#111] rounded-xl border border-black/10 text-xs">
                      <div className="font-bold text-black dark:text-white truncate">{senderName}</div>
                      <div className="font-semibold text-black/90 dark:text-white/90">
                        {subjectLine.length > 38 ? `${subjectLine.substring(0, 38)}...` : subjectLine}
                      </div>
                      <div className="text-[11px] text-black/50 dark:text-white/50 truncate mt-0.5">
                        {preheaderText}
                      </div>
                    </div>
                  </div>

                  {/* Gmail Mobile */}
                  <div className="p-4 bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-2xl flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-black dark:text-white flex items-center gap-1.5">
                        <Smartphone size={14} className="text-red-500" /> Gmail App (Android / iOS)
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/10 text-red-600">
                        ~32 Chars Max
                      </span>
                    </div>
                    <div className="p-3 bg-white dark:bg-[#111] rounded-xl border border-black/10 text-xs">
                      <div className="font-bold text-black dark:text-white truncate">{senderName}</div>
                      <div className="font-semibold text-black/90 dark:text-white/90">
                        {subjectLine.length > 32 ? `${subjectLine.substring(0, 32)}...` : subjectLine}
                      </div>
                      <div className="text-[11px] text-black/50 dark:text-white/50 truncate mt-0.5">
                        {preheaderText}
                      </div>
                    </div>
                  </div>

                  {/* Gmail Desktop */}
                  <div className="p-4 bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-2xl flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-black dark:text-white flex items-center gap-1.5">
                        <Monitor size={14} className="text-red-500" /> Gmail Desktop Web
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600">
                        ~75 Chars Max
                      </span>
                    </div>
                    <div className="p-3 bg-white dark:bg-[#111] rounded-xl border border-black/10 text-xs flex items-center justify-between gap-2">
                      <div className="font-bold text-black dark:text-white w-32 truncate">{senderName}</div>
                      <div className="flex-1 truncate">
                        <span className="font-bold text-black dark:text-white">
                          {subjectLine.length > 75 ? `${subjectLine.substring(0, 75)}...` : subjectLine}
                        </span>
                        <span className="text-black/50 dark:text-white/50 ml-2"> - {preheaderText}</span>
                      </div>
                    </div>
                  </div>

                  {/* Outlook Desktop */}
                  <div className="p-4 bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-2xl flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-black dark:text-white flex items-center gap-1.5">
                        <Monitor size={14} className="text-blue-600" /> Outlook 2021 Desktop
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-600/10 text-blue-600">
                        ~55 Chars Max
                      </span>
                    </div>
                    <div className="p-3 bg-white dark:bg-[#111] rounded-xl border border-black/10 text-xs">
                      <div className="font-bold text-black dark:text-white truncate">{senderName}</div>
                      <div className="font-semibold text-black/90 dark:text-white/90">
                        {subjectLine.length > 55 ? `${subjectLine.substring(0, 55)}...` : subjectLine}
                      </div>
                      <div className="text-[11px] text-black/50 dark:text-white/50 truncate mt-0.5">
                        {preheaderText}
                      </div>
                    </div>
                  </div>

                </div>
              </div>

              {/* Section 2: BIMI & Sender Brand Avatar Simulator */}
              <div className="flex flex-col gap-4 pt-6 border-t border-black/10 dark:border-white/10">
                <div>
                  <h2 className="text-base font-bold text-black dark:text-white flex items-center gap-2">
                    <ShieldCheck className="text-emerald-500" size={18} /> BIMI Avatar &amp; Verified Sender Simulator
                  </h2>
                  <p className="text-xs text-black/60 dark:text-white/60">
                    Test your Brand Indicators for Message Identification (BIMI) SVG avatar and Verified Mark Certificate (VMC) blue checkmark.
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  {/* Controls */}
                  <div className="p-4 bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-2xl flex flex-col gap-3 text-xs">
                    <div>
                      <label className="font-semibold text-black/70 dark:text-white/70">Sender Name</label>
                      <input type="text" value={senderName} onChange={(e) => setSenderName(e.target.value)} className="w-full mt-1 bg-white dark:bg-[#111] border border-black/10 dark:border-white/10 rounded-xl px-3 py-1.5" />
                    </div>
                    <div>
                      <label className="font-semibold text-black/70 dark:text-white/70">Sender Email</label>
                      <input type="text" value={senderEmail} onChange={(e) => setSenderEmail(e.target.value)} className="w-full mt-1 bg-white dark:bg-[#111] border border-black/10 dark:border-white/10 rounded-xl px-3 py-1.5" />
                    </div>
                    <div>
                      <label className="font-semibold text-black/70 dark:text-white/70">BIMI Logo Avatar URL</label>
                      <input type="text" value={bimiLogoUrl} onChange={(e) => setBimiLogoUrl(e.target.value)} className="w-full mt-1 bg-white dark:bg-[#111] border border-black/10 dark:border-white/10 rounded-xl px-3 py-1.5" />
                    </div>

                    <div className="p-2.5 bg-white dark:bg-[#111] rounded-xl border border-black/10 flex items-center justify-between mt-1">
                      <span className="font-bold text-black dark:text-white">VMC Verified Checkmark Badge</span>
                      <button 
                        onClick={() => setHasVmcBadge(!hasVmcBadge)}
                        className={`w-10 h-5 rounded-full transition-colors p-0.5 flex items-center ${hasVmcBadge ? 'bg-blue-600 justify-end' : 'bg-black/20 justify-start'}`}
                      >
                        <div className="w-4 h-4 rounded-full bg-white shadow-sm" />
                      </button>
                    </div>
                  </div>

                  {/* Simulated Inbox Row preview */}
                  <div className="lg:col-span-2 p-5 bg-white dark:bg-[#111] border border-black/10 dark:border-white/10 rounded-2xl flex flex-col gap-4 shadow-sm">
                    <span className="text-xs font-bold uppercase tracking-wider text-black/40 dark:text-white/40">Gmail Inbox Simulator View</span>
                    
                    <div className="p-4 bg-black/5 dark:bg-white/5 rounded-2xl border border-black/5 flex items-center gap-4">
                      {/* BIMI Logo */}
                      <div className="relative flex-shrink-0">
                        <img src={bimiLogoUrl} alt="BIMI Avatar" className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-md" />
                        {hasVmcBadge && (
                          <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center border-2 border-white shadow-sm" title="Verified Mark Certificate (VMC)">
                            <Check size={12} strokeWidth={3} />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 font-bold text-sm text-black dark:text-white">
                          <span className="truncate">{senderName}</span>
                          {hasVmcBadge && <CheckCircle2 size={15} className="text-blue-500 fill-blue-500/20" />}
                          <span className="text-xs font-normal text-black/40 dark:text-white/40">&lt;{senderEmail}&gt;</span>
                        </div>
                        <div className="text-xs font-semibold text-black/90 dark:text-white/90 truncate mt-0.5">
                          {subjectLine}
                        </div>
                        <div className="text-xs text-black/50 dark:text-white/50 truncate">
                          {preheaderText}
                        </div>
                      </div>
                    </div>
                  </div>

                </div>
              </div>

            </div>
          )}

          {/* Tab 6: Spam Filter & Multi-Client Deliverability Audit */}
          {activeTab === 'spam_check' && (
            <div className="h-full p-6 overflow-y-auto custom-scrollbar flex flex-col gap-6">
              
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-black/10 dark:border-white/10">
                <div>
                  <h2 className="text-base font-bold text-black dark:text-white flex items-center gap-2">
                    <ShieldAlert className="text-red-500" size={18} /> Multi-Client Spam &amp; Deliverability Audit
                  </h2>
                  <p className="text-xs text-black/60 dark:text-white/60">
                    Comprehensive cross-client deliverability scanner for Gmail, Outlook, Apple Mail, Yahoo, Thunderbird, and ProtonMail.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={handleMinifyHtml}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm"
                  >
                    <Zap size={14} /> Minify HTML
                  </button>
                  <button 
                    onClick={handleFixMissingAltTags}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm"
                  >
                    <FileCheck size={14} /> Auto-Fix Alt Text
                  </button>
                </div>
              </div>

              {/* Key Metrics Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                
                {/* 1. Spam Score */}
                <div className="p-4 bg-black/5 dark:bg-white/5 rounded-2xl border border-black/5 flex flex-col items-center justify-center text-center gap-2">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-black/50 dark:text-white/50">
                    Deliverability Risk Index
                  </span>
                  <div className={`text-4xl font-black ${spamScore > 50 ? 'text-red-500' : spamScore > 20 ? 'text-amber-500' : 'text-emerald-500'}`}>
                    {spamScore} <span className="text-xs font-normal text-black/40 dark:text-white/40">/ 100</span>
                  </div>
                  <div className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${spamScore > 50 ? 'bg-red-500/10 text-red-600' : spamScore > 20 ? 'bg-amber-500/10 text-amber-600' : 'bg-emerald-500/10 text-emerald-600'}`}>
                    {spamScore > 50 ? 'High Risk of Spam Folder' : spamScore > 20 ? 'Moderate Caution' : 'Inbox Ready'}
                  </div>
                </div>

                {/* 2. HTML Size */}
                <div className="p-4 bg-black/5 dark:bg-white/5 rounded-2xl border border-black/5 flex flex-col justify-between gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-black/50 dark:text-white/50">
                      HTML Markup Size
                    </span>
                    <FileText size={16} className={htmlByteSize > 102 * 1024 ? 'text-red-500' : 'text-emerald-500'} />
                  </div>
                  <div>
                    <div className="text-2xl font-black text-black dark:text-white">
                      {(htmlByteSize / 1024).toFixed(1)} <span className="text-xs font-semibold text-black/40 dark:text-white/40">KB</span>
                    </div>
                    <div className="text-[11px] font-medium text-black/60 dark:text-white/60 mt-0.5">
                      {htmlByteSize > 102 * 1024 ? (
                        <span className="text-red-500 font-bold flex items-center gap-1">
                          <AlertTriangle size={12} /> Exceeds Gmail 102KB Limit
                        </span>
                      ) : (
                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                          Under 102KB (Safe from clipping)
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* 3. Image vs Text Balance */}
                <div className="p-4 bg-black/5 dark:bg-white/5 rounded-2xl border border-black/5 flex flex-col justify-between gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-black/50 dark:text-white/50">
                      Image / Text Ratio
                    </span>
                    <ImageIcon size={16} className={imageTextRatioData.ratioStatus === 'high_risk' ? 'text-red-500' : 'text-blue-500'} />
                  </div>
                  <div>
                    <div className="text-2xl font-black text-black dark:text-white">
                      {imageTextRatioData.textPercent}% <span className="text-xs font-semibold text-black/40 dark:text-white/40">Text</span>
                    </div>
                    <div className="text-[11px] font-medium text-black/60 dark:text-white/60 mt-0.5">
                      {imageTextRatioData.ratioStatus === 'high_risk' ? (
                        <span className="text-red-500 font-bold">High Image Ratio (&lt;40% Text)</span>
                      ) : imageTextRatioData.ratioStatus === 'moderate' ? (
                        <span className="text-amber-500 font-bold">Moderate Balance (40-60%)</span>
                      ) : (
                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Optimal (&gt;60% Text)</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* 4. Broken Links & Alt Text */}
                <div className="p-4 bg-black/5 dark:bg-white/5 rounded-2xl border border-black/5 flex flex-col justify-between gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-black/50 dark:text-white/50">
                      Link &amp; Alt Health
                    </span>
                    <LinkIcon size={16} className={linkDetectorData.missingAltCount + linkDetectorData.placeholderLinksCount > 0 ? 'text-amber-500' : 'text-emerald-500'} />
                  </div>
                  <div>
                    <div className="text-2xl font-black text-black dark:text-white">
                      {linkDetectorData.totalLinks} <span className="text-xs font-semibold text-black/40 dark:text-white/40">Links</span>
                    </div>
                    <div className="text-[11px] font-medium text-black/60 dark:text-white/60 mt-0.5 flex items-center gap-2">
                      <span className={linkDetectorData.missingAltCount > 0 ? 'text-amber-500 font-bold' : 'text-emerald-600 dark:text-emerald-400 font-semibold'}>
                        {linkDetectorData.missingAltCount} missing alt
                      </span>
                      <span>•</span>
                      <span className={linkDetectorData.placeholderLinksCount > 0 ? 'text-amber-500 font-bold' : 'text-emerald-600 dark:text-emerald-400 font-semibold'}>
                        {linkDetectorData.placeholderLinksCount} placeholders
                      </span>
                    </div>
                  </div>
                </div>

              </div>

              {/* Multi-Client Inbox Compatibility Audit Matrix */}
              <div className="flex flex-col gap-3">
                <h3 className="text-sm font-bold text-black dark:text-white flex items-center gap-2">
                  <Monitor size={16} className="text-blue-500" /> Multi-Client Inbox Compatibility Matrix
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {clientAuditSummary.map((client, idx) => (
                    <div key={idx} className="p-4 bg-white dark:bg-[#111] border border-black/10 dark:border-white/10 rounded-2xl flex flex-col gap-3 shadow-sm">
                      <div className="flex items-center justify-between border-b border-black/5 dark:border-white/5 pb-2.5">
                        <span className="font-bold text-xs text-black dark:text-white flex items-center gap-1.5">
                          {client.name}
                        </span>
                        <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                          client.badge === 'pass' 
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' 
                            : client.badge === 'warning'
                            ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                            : 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20'
                        }`}>
                          {client.badge === 'pass' ? '✓ PASS' : client.badge === 'warning' ? '⚠ WARN' : '✕ FAIL'}
                        </span>
                      </div>

                      <div className="flex flex-col gap-2 text-xs">
                        {client.checks.map((chk, cIdx) => (
                          <div key={cIdx} className="flex items-start gap-2">
                            {chk.passed ? (
                              <CheckCircle2 size={14} className="text-emerald-500 flex-shrink-0 mt-0.5" />
                            ) : (
                              <AlertTriangle size={14} className="text-amber-500 flex-shrink-0 mt-0.5" />
                            )}
                            <div className="flex-1 min-w-0">
                              <div className={`font-semibold text-[11px] ${chk.passed ? 'text-black/80 dark:text-white/80' : 'text-amber-600 dark:text-amber-400'}`}>
                                {chk.name}
                              </div>
                              <div className="text-[10px] text-black/50 dark:text-white/50 truncate">
                                {chk.desc}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Spam Trigger Word Live Scanner */}
              <div className="p-5 bg-white dark:bg-[#111] border border-black/10 dark:border-white/10 rounded-2xl flex flex-col gap-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-sm text-black dark:text-white flex items-center gap-2">
                      <AlertTriangle className="text-amber-500" size={16} /> Flagged Spam Trigger Phrase Scanner ({detectedSpamDetailed.length})
                    </h3>
                    <p className="text-xs text-black/50 dark:text-white/50 mt-0.5">
                      Scanned against dictionary of 100+ spam trigger phrases used by Gmail, SpamAssassin, &amp; Barracuda filters.
                    </p>
                  </div>
                </div>

                {detectedSpamDetailed.length === 0 ? (
                  <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-xl text-xs font-semibold flex items-center gap-2">
                    <CheckCircle2 size={16} /> No high-risk spam trigger phrases detected in your subject line or email body!
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                    {detectedSpamDetailed.map((item, idx) => (
                      <div key={idx} className="p-2.5 bg-red-500/5 border border-red-500/20 rounded-xl flex items-center justify-between text-xs">
                        <div className="flex flex-col min-w-0">
                          <span className="font-bold text-red-600 dark:text-red-400 truncate">"{item.word}"</span>
                          <span className="text-[10px] text-black/50 dark:text-white/50">{item.category}</span>
                        </div>
                        <span className="px-2 py-0.5 bg-red-500/10 text-red-600 text-[9px] font-extrabold uppercase rounded-md ml-2 flex-shrink-0">
                          {item.location}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Image-to-Text Ratio Auditor & Broken Link Fixer Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Image-to-Text Ratio Auditor */}
                <div className="p-5 bg-white dark:bg-[#111] border border-black/10 dark:border-white/10 rounded-2xl flex flex-col gap-4 shadow-sm">
                  <h3 className="font-bold text-sm text-black dark:text-white flex items-center gap-2">
                    <ImageIcon className="text-blue-500" size={16} /> Image-to-Text Surface Area Auditor
                  </h3>

                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between text-xs font-bold text-black/70 dark:text-white/70">
                      <span>Text Area: {imageTextRatioData.textPercent}%</span>
                      <span>Image Area: {imageTextRatioData.imgPercent}%</span>
                    </div>

                    <div className="w-full h-3 bg-black/10 dark:bg-white/10 rounded-full overflow-hidden flex">
                      <div className="h-full bg-blue-600 transition-all duration-300" style={{ width: `${imageTextRatioData.textPercent}%` }} />
                      <div className="h-full bg-amber-500 transition-all duration-300" style={{ width: `${imageTextRatioData.imgPercent}%` }} />
                    </div>

                    <div className="grid grid-cols-3 gap-2 mt-2 text-center text-xs">
                      <div className="p-2 bg-black/5 dark:bg-white/5 rounded-xl">
                        <span className="text-[10px] text-black/50 dark:text-white/50 block">Visible Chars</span>
                        <span className="font-bold text-black dark:text-white">{imageTextRatioData.visibleChars}</span>
                      </div>
                      <div className="p-2 bg-black/5 dark:bg-white/5 rounded-xl">
                        <span className="text-[10px] text-black/50 dark:text-white/50 block">Word Count</span>
                        <span className="font-bold text-black dark:text-white">{imageTextRatioData.wordCount}</span>
                      </div>
                      <div className="p-2 bg-black/5 dark:bg-white/5 rounded-xl">
                        <span className="text-[10px] text-black/50 dark:text-white/50 block">Total Images</span>
                        <span className="font-bold text-black dark:text-white">{imageTextRatioData.imgCount}</span>
                      </div>
                    </div>

                    {imageTextRatioData.ratioStatus === 'high_risk' && (
                      <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-600 text-xs rounded-xl flex items-center gap-2 mt-1">
                        <AlertTriangle size={16} className="flex-shrink-0" />
                        <span>High spam risk! Email clients flag messages with over 60% image content. Add more HTML body text.</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Broken Links, Alt Text & Placeholder Quick Fixes */}
                <div className="p-5 bg-white dark:bg-[#111] border border-black/10 dark:border-white/10 rounded-2xl flex flex-col gap-4 shadow-sm">
                  <h3 className="font-bold text-sm text-black dark:text-white flex items-center gap-2">
                    <LinkIcon className="text-emerald-500" size={16} /> Link &amp; Placeholder Auto-Fix Studio
                  </h3>

                  <div className="flex flex-col gap-3 text-xs">
                    
                    {/* Placeholder Links */}
                    <div className="p-3 bg-black/5 dark:bg-white/5 rounded-xl flex items-center justify-between">
                      <div>
                        <div className="font-bold text-black dark:text-white">Placeholder Anchors (href="#")</div>
                        <div className="text-[11px] text-black/50 dark:text-white/50">Found {linkDetectorData.placeholderLinksCount} dummy placeholder links</div>
                      </div>
                      <button 
                        onClick={handleFixPlaceholdersAndLinks}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors"
                      >
                        Fix Placeholders
                      </button>
                    </div>

                    {/* Missing Alt Attributes */}
                    <div className="p-3 bg-black/5 dark:bg-white/5 rounded-xl flex items-center justify-between">
                      <div>
                        <div className="font-bold text-black dark:text-white">Missing Alt Text Tags</div>
                        <div className="text-[11px] text-black/50 dark:text-white/50">Found {linkDetectorData.missingAltCount} images without alt attributes</div>
                      </div>
                      <button 
                        onClick={handleFixMissingAltTags}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition-colors"
                      >
                        Add Alt Tags
                      </button>
                    </div>

                    {/* Unreplaced Merge Tags */}
                    {linkDetectorData.unreplacedMergeTags.length > 0 && (
                      <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex flex-col gap-1">
                        <div className="font-bold text-amber-600 dark:text-amber-400">Unreplaced Dynamic Merge Tags</div>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {linkDetectorData.unreplacedMergeTags.map((tag, tIdx) => (
                            <span key={tIdx} className="px-2 py-0.5 bg-amber-500/20 text-amber-700 dark:text-amber-300 font-mono text-[10px] rounded">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                  </div>
                </div>

              </div>

            </div>
          )}

          {/* Tab 7: Campaign Workflow & Export Studio */}
          {activeTab === 'campaign_workflow' && (
            <div className="h-full p-6 overflow-y-auto custom-scrollbar flex flex-col gap-6">
              
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-black/10 dark:border-white/10">
                <div>
                  <h2 className="text-base font-bold text-black dark:text-white flex items-center gap-2">
                    <Zap className="text-red-500" size={18} /> Campaign Workflow &amp; Export Studio
                  </h2>
                  <p className="text-xs text-black/60 dark:text-white/60">
                    UTM Batch Parameter Builder, ESP Merge Tag Transpiler, Plain Text Extractor, and Production ZIP Exporter.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={handleExportZip}
                    className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-2"
                  >
                    <Download size={15} /> Export Production Bundle (ZIP)
                  </button>
                </div>
              </div>

              {/* 1. UTM Batch Parameter Builder */}
              <div className="p-5 bg-white dark:bg-[#111] border border-black/10 dark:border-white/10 rounded-2xl flex flex-col gap-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-black dark:text-white flex items-center gap-2">
                    <LinkIcon className="text-blue-500" size={16} /> UTM Batch Parameter Builder
                  </h3>
                  <span className="text-xs font-semibold px-2.5 py-1 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-lg">
                    Scanned Links: {linkDetectorData.totalLinks}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-3 text-xs">
                  <div>
                    <label className="font-semibold text-black/70 dark:text-white/70 block mb-1">UTM Source</label>
                    <input 
                      type="text" 
                      value={utmSource} 
                      onChange={(e) => setUtmSource(e.target.value)} 
                      placeholder="newsletter" 
                      className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl px-3 py-1.5 focus:outline-none" 
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-black/70 dark:text-white/70 block mb-1">UTM Medium</label>
                    <input 
                      type="text" 
                      value={utmMedium} 
                      onChange={(e) => setUtmMedium(e.target.value)} 
                      placeholder="email" 
                      className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl px-3 py-1.5 focus:outline-none" 
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-black/70 dark:text-white/70 block mb-1">UTM Campaign</label>
                    <input 
                      type="text" 
                      value={utmCampaign} 
                      onChange={(e) => setUtmCampaign(e.target.value)} 
                      placeholder="summer_promo_2026" 
                      className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl px-3 py-1.5 focus:outline-none" 
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-black/70 dark:text-white/70 block mb-1">UTM Term</label>
                    <input 
                      type="text" 
                      value={utmTerm} 
                      onChange={(e) => setUtmTerm(e.target.value)} 
                      placeholder="cta_hero" 
                      className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl px-3 py-1.5 focus:outline-none" 
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-black/70 dark:text-white/70 block mb-1">UTM Content</label>
                    <input 
                      type="text" 
                      value={utmContent} 
                      onChange={(e) => setUtmContent(e.target.value)} 
                      placeholder="button_v1" 
                      className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl px-3 py-1.5 focus:outline-none" 
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <button 
                    onClick={handleAppendUtm}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs transition-colors flex items-center gap-1.5 shadow-sm"
                  >
                    <Zap size={14} /> Inject / Update UTM Parameters on All Links
                  </button>
                </div>
              </div>

              {/* 2. ESP Dynamic Merge Tag Transpiler */}
              <div className="p-5 bg-white dark:bg-[#111] border border-black/10 dark:border-white/10 rounded-2xl flex flex-col gap-4 shadow-sm">
                <h3 className="font-bold text-sm text-black dark:text-white flex items-center gap-2">
                  <RefreshCw className="text-purple-500" size={16} /> ESP Dynamic Merge Tag Transpiler
                </h3>

                <p className="text-xs text-black/60 dark:text-white/60">
                  Select your target Email Service Provider (ESP) to convert personalization merge tags (first name, email, unsubscribe links) to native platform syntax.
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <button 
                    onClick={() => handleTranspileEspTags('mailchimp')}
                    className="p-3 bg-black/5 dark:bg-white/5 hover:bg-purple-600 hover:text-white rounded-xl border border-black/5 flex flex-col items-center justify-center gap-1 text-xs font-bold transition-all"
                  >
                    <span>Mailchimp</span>
                    <span className="text-[10px] font-mono opacity-75">*|FNAME|*, *|UNSUB|*</span>
                  </button>
                  <button 
                    onClick={() => handleTranspileEspTags('klaviyo')}
                    className="p-3 bg-black/5 dark:bg-white/5 hover:bg-purple-600 hover:text-white rounded-xl border border-black/5 flex flex-col items-center justify-center gap-1 text-xs font-bold transition-all"
                  >
                    <span>Klaviyo</span>
                    <span className="text-[10px] font-mono opacity-75">&#123;&#123; first_name &#125;&#123;</span>
                  </button>
                  <button 
                    onClick={() => handleTranspileEspTags('hubspot')}
                    className="p-3 bg-black/5 dark:bg-white/5 hover:bg-purple-600 hover:text-white rounded-xl border border-black/5 flex flex-col items-center justify-center gap-1 text-xs font-bold transition-all"
                  >
                    <span>HubSpot</span>
                    <span className="text-[10px] font-mono opacity-75">&#123;&#123; contact.firstname &#125;&#123;</span>
                  </button>
                  <button 
                    onClick={() => handleTranspileEspTags('sendgrid')}
                    className="p-3 bg-black/5 dark:bg-white/5 hover:bg-purple-600 hover:text-white rounded-xl border border-black/5 flex flex-col items-center justify-center gap-1 text-xs font-bold transition-all"
                  >
                    <span>SendGrid</span>
                    <span className="text-[10px] font-mono opacity-75">-firstname-</span>
                  </button>
                </div>
              </div>

              {/* 3. Plain Text Fallback Generator & Export */}
              <div className="p-5 bg-white dark:bg-[#111] border border-black/10 dark:border-white/10 rounded-2xl flex flex-col gap-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-black dark:text-white flex items-center gap-2">
                    <FileText className="text-emerald-500" size={16} /> Plain Text Fallback Generator
                  </h3>
                  <button 
                    onClick={handleExtractPlainText}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition-colors flex items-center gap-1.5 shadow-sm"
                  >
                    <Copy size={13} /> Copy Plain Text Version
                  </button>
                </div>

                <div className="p-4 bg-black/5 dark:bg-white/5 rounded-xl text-xs font-mono text-black/70 dark:text-white/70 max-h-48 overflow-y-auto leading-relaxed border border-black/5">
                  {htmlInput
                    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
                    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
                    .replace(/<a\s+[^>]*href=["']([^"']+)["'][^>]*>(.*?)<\/a>/gi, '$2 [$1]')
                    .replace(/<\/(div|p|h[1-6]|tr|li)>/gi, '\n')
                    .replace(/<br\s*\/?>/gi, '\n')
                    .replace(/<[^>]+>/g, '')
                    .replace(/&nbsp;/g, ' ')
                    .replace(/\n\s*\n/g, '\n\n')
                    .trim()}
                </div>
              </div>

            </div>
          )}

        </main>
      </div>

      {/* Invasive Change Safeguard Confirmation Modal */}
      <InvasiveChangeModal
        isOpen={modalConfig.isOpen}
        title={modalConfig.title}
        operationCategory={modalConfig.operationCategory}
        riskLevel={modalConfig.riskLevel}
        summaryDescription={modalConfig.summaryDescription}
        items={modalConfig.items}
        onConfirm={modalConfig.onConfirm}
        onCancel={() => setModalConfig(prev => ({ ...prev, isOpen: false }))}
      />

    </div>
  );
};

export default NewsletterStudio;
