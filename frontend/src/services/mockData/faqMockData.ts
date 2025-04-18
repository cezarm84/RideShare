/**
 * Mock data for FAQ functionality
 *
 * This file contains mock data for testing the FAQ components
 * without requiring a backend connection.
 *
 * IMPORTANT: This mock data should ONLY be used in test files,
 * not in production code. The actual application should always
 * use the real API data.
 */

import { FAQListResponse } from '../FAQService';

/**
 * Mock FAQ data organized by categories
 */
export const mockFAQData: FAQListResponse = {
  categories: [
    {
      id: 1,
      name: 'General',
      description: 'General questions about RideShare',
      icon: null,
      display_order: 1,
      is_active: true,
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-01T00:00:00Z',
      faqs: [
        {
          id: 1,
          question: 'What is RideShare?',
          answer: '<p>RideShare is a revolutionary collective mobility platform designed to create a more flexible, sustainable transportation ecosystem. Unlike traditional ride-hailing services (Uber, Bolt, Lyft), our concept focuses on optimizing existing commute patterns and infrastructure.</p><p>Our platform facilitates three key ride types:</p><ul><li><strong>Hub-to-Hub:</strong> Connecting transportation hubs for seamless multi-modal journeys</li><li><strong>Hub-to-Destination:</strong> Bridging the gap between public transit and final destinations</li><li><strong>Enterprise:</strong> Customized solutions for companies to optimize employee commutes</li></ul><p>We target specific customer segments with shared transportation needs, particularly commuters and businesses looking to reduce their carbon footprint while improving mobility efficiency. By intelligently matching riders with similar routes and schedules, we create a more collective, flexible traffic system that complements rather than competes with public transportation.</p><p>Our vision is to transform urban mobility by making shared transportation the preferred option for daily commutes, reducing congestion, emissions, and transportation costs while building stronger communities.</p>',
          category_id: 1,
          display_order: 1,
          is_active: true,
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-01T00:00:00Z',
        },
        {
          id: 2,
          question: 'How do I create an account?',
          answer: '<p>Creating an account on RideShare is simple:</p><ol><li>Click on the "Sign Up" button in the top right corner of the homepage</li><li>Enter your email address and create a password</li><li>Provide your personal details including name and phone number</li><li>Add your home and work addresses for better ride matching</li><li>Verify your email address by clicking the link sent to your inbox</li></ol><p>Once your account is created, you can start booking rides immediately!</p>',
          category_id: 1,
          display_order: 2,
          is_active: true,
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-01T00:00:00Z',
        },
        {
          id: 3,
          question: 'Is my personal information secure?',
          answer: '<p>Yes, we take data security very seriously. RideShare implements industry-standard security measures to protect your personal information:</p><ul><li>All data is encrypted both in transit and at rest</li><li>We use secure payment processing systems</li><li>Personal information is only shared with drivers as needed for ride coordination</li><li>We comply with all relevant data protection regulations</li></ul><p>For more details, please review our <a href="/privacy-policy">Privacy Policy</a>.</p>',
          category_id: 1,
          display_order: 3,
          is_active: true,
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-01T00:00:00Z',
        },
      ],
    },
    {
      id: 2,
      name: 'Booking & Rides',
      description: 'Questions about booking and managing rides',
      icon: null,
      display_order: 2,
      is_active: true,
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-01T00:00:00Z',
      faqs: [
        {
          id: 4,
          question: 'How do I book a journey?',
          answer: '<p>Booking a journey on our collective mobility platform is easy:</p><ol><li>Log in to your RideShare account</li><li>On the dashboard, enter your starting point and destination</li><li>Select your preferred date and time</li><li>Our system will show available mobility options based on your preferences</li><li>Choose the option that best suits your needs (Hub-to-Hub, Hub-to-Destination, or Enterprise)</li><li>Review the journey details including price, estimated arrival time, and environmental impact</li><li>Select your payment method</li><li>Confirm your booking</li></ol><p>You\'ll receive a confirmation email with all the details of your journey, including meeting points and any connection information.</p>',
          category_id: 2,
          display_order: 1,
          is_active: true,
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-01T00:00:00Z',
        },
        {
          id: 5,
          question: 'Can I cancel my booking?',
          answer: '<p>Yes, you can cancel a booking, but our cancellation policy varies depending on how close you are to the scheduled departure time:</p><ul><li><strong>More than 24 hours before departure:</strong> Full refund</li><li><strong>12-24 hours before departure:</strong> 75% refund</li><li><strong>4-12 hours before departure:</strong> 50% refund</li><li><strong>Less than 4 hours before departure:</strong> No refund</li></ul><p>To cancel a booking, go to "My Bookings" in your account, find the journey you want to cancel, and click the "Cancel" button.</p><p>Please note that late cancellations impact the efficiency of our collective mobility system and may affect other passengers with similar routes.</p>',
          category_id: 2,
          display_order: 2,
          is_active: true,
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-01T00:00:00Z',
        },
        {
          id: 6,
          question: 'How does RideShare ensure reliable service?',
          answer: '<p>Reliability is at the core of our collective mobility platform:</p><ol><li>We implement intelligent scheduling algorithms to optimize ride planning</li><li>Our system includes built-in redundancies and backup options</li><li>We maintain a network of verified transportation partners</li><li>Real-time monitoring allows us to proactively address potential disruptions</li><li>Our customer support team is available to assist with any service issues</li></ol><p>In the rare event of a service disruption, we immediately work to provide alternative transportation options and ensure you reach your destination.</p>',
          category_id: 2,
          display_order: 3,
          is_active: true,
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-01T00:00:00Z',
        },
      ],
    },
    {
      id: 3,
      name: 'Payments',
      description: 'Questions about payments and billing',
      icon: null,
      display_order: 3,
      is_active: true,
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-01T00:00:00Z',
      faqs: [
        {
          id: 7,
          question: 'What payment methods are accepted?',
          answer: '<p>RideShare accepts various payment methods to make your experience convenient:</p><ul><li>Credit and debit cards (Visa, Mastercard, American Express)</li><li>PayPal</li><li>Apple Pay</li><li>Google Pay</li><li>Swish (in Sweden)</li></ul><p>You can add and manage your payment methods in the "Payment" section of your account settings.</p>',
          category_id: 3,
          display_order: 1,
          is_active: true,
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-01T00:00:00Z',
        },
        {
          id: 8,
          question: 'How do I get a receipt for my ride?',
          answer: '<p>Receipts are automatically generated for all completed rides. You can access your receipts in several ways:</p><ol><li>An email receipt is sent to your registered email address after each ride</li><li>In the app, go to "My Bookings" and select the ride to view and download the receipt</li><li>In your account settings, go to "Payment History" for a complete list of all transactions</li></ol><p>For business users, we offer detailed monthly statements that can be used for expense reporting.</p>',
          category_id: 3,
          display_order: 2,
          is_active: true,
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-01T00:00:00Z',
        },
      ],
    },
    {
      id: 4,
      name: 'Enterprise Services',
      description: 'Information about our enterprise solutions',
      icon: null,
      display_order: 4,
      is_active: true,
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-01T00:00:00Z',
      faqs: [
        {
          id: 9,
          question: 'What are enterprise rides?',
          answer: '<p>Enterprise rides are a special service designed for companies and their employees:</p><ul><li>Companies can set up dedicated transportation for their employees</li><li>Rides can be scheduled between company locations and transportation hubs</li><li>Employees with similar commutes are intelligently matched to share rides</li><li>Companies can subsidize the cost of employee transportation</li><li>Detailed reporting provides insights into usage patterns and environmental impact</li></ul><p>Enterprise rides help companies reduce their carbon footprint while providing a valuable benefit to employees.</p>',
          category_id: 4,
          display_order: 1,
          is_active: true,
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-01T00:00:00Z',
        },
        {
          id: 10,
          question: 'How can my company sign up for enterprise services?',
          answer: '<p>To set up RideShare enterprise services for your company:</p><ol><li>Contact our enterprise sales team at <a href="mailto:enterprise@rideshare.example.com">enterprise@rideshare.example.com</a></li><li>Schedule a consultation to discuss your company\'s specific needs</li><li>Our team will create a customized plan based on your requirements</li><li>Once approved, we\'ll set up your company account and provide admin access</li><li>We\'ll help onboard your employees and provide training for administrators</li></ol><p>We offer flexible plans to accommodate companies of all sizes, from small businesses to large corporations.</p>',
          category_id: 4,
          display_order: 2,
          is_active: true,
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-01T00:00:00Z',
        },
      ],
    },
  ],
  uncategorized: [
    {
      id: 11,
      question: 'Is RideShare available in my city?',
      answer: '<p>RideShare is currently available in Gothenburg (Göteborg) and surrounding municipalities (kommuner) in Västra Götaland, Sweden. We are perfecting our collective mobility platform in this region before expanding nationwide.</p><p>Our current service area includes:</p><ul><li>Göteborg (Gothenburg)</li><li>Mölndal</li><li>Partille</li><li>Kungälv</li><li>Öckerö</li><li>Ale</li></ul><p>Within these areas, we connect all major transportation hubs, business districts, residential areas, and educational institutions. We\'re focused on creating an exceptional mobility experience in the Gothenburg region before expanding to other parts of Sweden. If you\'re interested in bringing RideShare to your municipality, you can sign up for notifications to be alerted about our expansion plans.</p>',
      category_id: null,
      display_order: 1,
      is_active: true,
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-01T00:00:00Z',
    },
    {
      id: 12,
      question: 'How do I become a driver?',
      answer: '<p>To become a RideShare driver, you need to meet certain requirements and complete our application process:</p><ol><li>You must be at least 21 years old</li><li>Have a valid driver\'s license with at least 2 years of driving experience</li><li>Own or have access to a vehicle that meets our requirements</li><li>Pass a background check</li><li>Complete our driver safety training</li></ol><p>To start the application process, click on "Become a Driver" in the app or website and follow the instructions. The approval process typically takes 3-5 business days.</p>',
      category_id: null,
      display_order: 2,
      is_active: true,
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-01T00:00:00Z',
    },
  ],
};

/**
 * Get mock FAQ data
 * @returns Promise with mock FAQ data
 */
export const getMockFAQData = (): Promise<FAQListResponse> => {
  return new Promise((resolve) => {
    // Simulate network delay
    setTimeout(() => {
      resolve(mockFAQData);
    }, 500);
  });
};
