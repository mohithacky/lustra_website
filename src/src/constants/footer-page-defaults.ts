/**
 * Default content for footer pages
 * 
 * These defaults are shown when users haven't customized their footer pages yet.
 * When users edit pages via the editor, content is saved to user_website_pages table
 * and will override these defaults.
 */

export const FOOTER_PAGE_DEFAULTS = {
  'our-story': (shopName: string | null) => `Welcome to ${shopName || 'our store'}

Every piece of jewelry tells a story, and so do we.

Our journey began with a simple passion: to create beautiful, meaningful jewelry that celebrates life's special moments. What started as a small dream has grown into a beloved destination for those seeking quality craftsmanship and timeless designs.

We believe that jewelry is more than just an accessory – it's an expression of your unique style, a keeper of memories, and a treasure to be passed down through generations.

Our commitment to excellence drives everything we do:
• Carefully sourced materials
• Expert craftsmanship
• Attention to every detail
• Exceptional customer service

Thank you for being part of our story. We're honored to help you create yours.`,

  'careers': (shopName: string | null) => `JOIN OUR TEAM

At ${shopName || 'our store'}, we're always looking for passionate individuals who share our love for beautiful jewelry and exceptional customer service.

WHY WORK WITH US?

• Be part of a creative and dynamic team
• Opportunity to work with exquisite jewelry
• Competitive compensation and benefits
• Growth opportunities within the company
• A supportive and inclusive work environment

CURRENT OPENINGS

We're currently looking for talented individuals in the following areas:

Sales Associates
• Help customers find their perfect piece
• Provide exceptional customer service
• Build lasting relationships with clients

Store Management
• Lead and motivate our retail team
• Drive sales and achieve targets
• Ensure smooth store operations

Digital Marketing
• Manage our online presence
• Create engaging content
• Drive e-commerce growth

HOW TO APPLY

If you're interested in joining our team, please send your resume and a brief cover letter to our email address. Include the position you're applying for in the subject line.

We review all applications and will contact qualified candidates for interviews.

Even if there isn't a current opening that matches your skills, we'd love to hear from you! Send us your resume, and we'll keep it on file for future opportunities.`,

  'press': (shopName: string | null) => `PRESS & MEDIA

Welcome to the ${shopName || 'our'} press page. Here you'll find information for media inquiries and press coverage.

ABOUT US

${shopName || 'Our store'} is a premium jewelry destination offering exquisite pieces crafted with passion and precision. We specialize in creating timeless jewelry that celebrates life's special moments.

MEDIA CONTACT

For press inquiries, interviews, or media requests, please contact us through our main contact page. We aim to respond to all media inquiries within 48 hours.

PRESS RESOURCES

For media professionals, we can provide:
• High-resolution product images
• Brand logos and assets
• Press releases
• Company fact sheet
• Executive bios

BRAND GUIDELINES

When featuring ${shopName || 'our brand'} in your publication:
• Please use our official brand name as specified
• Use only approved logos and images
• Link to our official website when publishing online
• Contact us for quote approval before publication

RECENT COVERAGE

We're proud to have been featured in various publications and media outlets. For a complete list of our media coverage or to request press materials, please reach out to us.

COLLABORATION OPPORTUNITIES

We're open to collaborations with:
• Fashion and lifestyle publications
• Influencers and content creators
• Event organizers
• Brand partnerships

If you're interested in collaborating with us, we'd love to hear from you!`,

  'faqs': () => `Q: What payment methods do you accept?
A: We accept all major credit cards, debit cards, UPI, and net banking. Cash on delivery is also available for select locations.

Q: How long does shipping take?
A: Standard shipping takes 5-7 business days. Express shipping (2-3 business days) is available at an additional cost.

Q: Do you offer international shipping?
A: Currently, we ship within India only. We're working on expanding our shipping options.

Q: What is your return policy?
A: We offer a 7-day return policy for unused items in their original packaging. Please see our Returns page for full details.

Q: Are your products genuine?
A: Yes, all our products are 100% genuine and come with authenticity certificates where applicable.

Q: How do I track my order?
A: Once your order ships, you'll receive a tracking number via email and SMS. You can use this to track your delivery.

Q: Do you offer gift wrapping?
A: Yes! We offer complimentary gift wrapping for all orders. Just mention it in the order notes.

Q: How do I care for my jewelry?
A: Store your jewelry in a cool, dry place. Avoid exposure to perfumes, lotions, and water. Clean gently with a soft cloth.

Q: Can I customize my order?
A: Yes, we offer customization options for select products. Please contact us to discuss your requirements.

Q: How can I contact customer support?
A: You can reach us via phone, email, or WhatsApp. Visit our Contact Us page for details.`,

  'shipping': () => `SHIPPING INFORMATION

Domestic Shipping
• Standard Delivery: 5-7 business days
• Express Delivery: 2-3 business days (additional charges apply)
• Free shipping on orders above ₹5,000

All orders are carefully packaged to ensure safe delivery. You will receive a tracking number once your order is dispatched.

Order Processing
• Orders placed before 2 PM are processed the same day
• Orders placed after 2 PM are processed the next business day
• Custom orders may take 7-10 business days for processing

RETURN POLICY

We want you to be completely satisfied with your purchase. If you're not happy with your order, we're here to help.

Return Eligibility
• Returns accepted within 7 days of delivery
• Item must be unused and in original packaging
• Item must have all tags and certificates intact
• Custom or personalized items cannot be returned

How to Return
1. Contact our customer service team
2. Receive a return authorization number
3. Pack the item securely in its original packaging
4. Ship to our return address

Refund Process
• Refunds are processed within 5-7 business days
• Amount will be credited to your original payment method
• Shipping charges are non-refundable

EXCHANGE POLICY

We offer free exchanges for:
• Different size of the same item
• Different color/variant of the same item

To request an exchange, please contact our customer service team within 7 days of receiving your order.`,

  'warranty': () => `WARRANTY COVERAGE

We stand behind the quality of our products. All jewelry items come with our comprehensive warranty.

Standard Warranty Coverage
• Manufacturing defects: 1 year
• Stone settings: 6 months
• Plating (if applicable): 6 months

What's Covered
• Defects in materials and workmanship
• Stone fallout due to setting issues
• Clasp or mechanism failures
• Discoloration due to manufacturing defects

What's Not Covered
• Normal wear and tear
• Damage from accidents, misuse, or negligence
• Damage from exposure to chemicals, perfumes, or harsh cleaners
• Loss or theft
• Items modified by third parties
• Damage from improper storage

HOW TO CLAIM WARRANTY

1. Contact our customer service with your order details
2. Describe the issue with photos if possible
3. Our team will review and respond within 48 hours
4. If approved, ship the item to us for inspection
5. Repair or replacement will be processed within 7-10 business days

CARE RECOMMENDATIONS

To ensure your jewelry lasts:
• Remove jewelry before swimming, bathing, or exercising
• Apply perfumes and lotions before putting on jewelry
• Store in a cool, dry place, preferably in the provided box
• Clean gently with a soft, dry cloth
• Avoid contact with chemicals and harsh cleaners

AUTHENTICITY GUARANTEE

All our products are 100% genuine. Gold and diamond jewelry comes with:
• Hallmark certification
• Diamond certificates (for certified diamonds)
• Detailed invoice with product specifications

For any warranty-related questions, please contact our customer service team.`,
}

/**
 * Get default content for a footer page
 * @param slug - Page slug (e.g., 'our-story', 'careers')
 * @param shopName - Shop name for personalization
 * @returns Default content string
 */
export function getDefaultFooterPageContent(slug: string, shopName: string | null = null): string {
  const defaultFn = FOOTER_PAGE_DEFAULTS[slug as keyof typeof FOOTER_PAGE_DEFAULTS]
  if (!defaultFn) {
    return `Welcome to our ${slug.replace(/-/g, ' ')} page.\n\nContent coming soon.`
  }
  return defaultFn(shopName)
}
