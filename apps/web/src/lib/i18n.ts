export const LOCALES = ['en', 'bn'] as const
export type Locale = (typeof LOCALES)[number]
export const DEFAULT_LOCALE: Locale = 'en'

export interface Dictionary {
  nav: {
    home: string
    categories: string
    searchPlaceholder: string
    cart: string
    trackOrder: string
    language: string
  }
  home: {
    heroBadge: string
    heroTitle: string
    heroHighlight: string
    heroSubtitle: string
    shopNow: string
    categoriesTitle: string
    categoriesSubtitle: string
    featuredTitle: string
    featuredSubtitle: string
    viewAll: string
    trustCod: string
    trustCodDesc: string
    trustDelivery: string
    trustDeliveryDesc: string
    trustOriginal: string
    trustOriginalDesc: string
    trustSupport: string
    trustSupportDesc: string
  }
  catalog: {
    allProducts: string
    noProducts: string
    noProductsDesc: string
    inStock: string
    outOfStock: string
    lowStock: string
    saleBadge: string
    filterCategory: string
    sortBy: string
    priceLowHigh: string
    priceHighLow: string
  }
  pdp: {
    sku: string
    brand: string
    origin: string
    warranty: string
    nonReturnable: string
    returnable: string
    selectVariant: string
    quantity: string
    addToCart: string
    buyNow: string
    deliveryEstimate: string
    deliveryNote: string
    specifications: string
    careInstructions: string
    description: string
    cartStubNotice: string
    outOfStockWarning: string
  }
  cart: {
    title: string
    emptyTitle: string
    emptySubtitle: string
    continueShopping: string
    startShopping: string
    item: string
    items: string
    product: string
    price: string
    quantity: string
    total: string
    subtotal: string
    delivery: string
    deliveryCalculated: string
    orderTotal: string
    checkout: string
    proceedToCheckout: string
    viewCart: string
    remove: string
    clearCart: string
    addedToCart: string
    updatedQuantity: string
    removedItem: string
    outOfStock: string
    insufficientStock: string
    invalidQuantity: string
    errorOccurred: string
  }
  checkout: {
    title: string
    subtitle: string
    customerInfo: string
    guestNotice: string
    firstName: string
    lastName: string
    phone: string
    phonePlaceholder: string
    phoneHelp: string
    altPhone: string
    deliveryAddress: string
    division: string
    selectDivision: string
    district: string
    selectDistrict: string
    thana: string
    selectThana: string
    streetAddress: string
    streetPlaceholder: string
    postalCode: string
    deliveryZone: string
    deliveryFee: string
    paymentMethod: string
    cod: string
    codNotice: string
    bkash: string
    nagad: string
    orderReview: string
    confirmDetails: string
    handoffBannerTitle: string
    handoffBannerDesc: string
    priceChangedNotice: string
    acknowledgePrice: string
    outOfStockNotice: string
    insufficientStockNotice: string
    validating: string
    successReady: string
    phoneError: string
    addressError: string
    placeCodOrder: string
  }
  orderConfirmation: {
    title: string
    subtitle: string
    orderId: string
    orderDate: string
    paymentMethod: string
    cod: string
    codNotice: string
    customerInfo: string
    recipient: string
    phone: string
    address: string
    deliveryZone: string
    items: string
    product: string
    quantity: string
    price: string
    subtotal: string
    deliveryFee: string
    total: string
    trackOrder: string
    trackNotice: string
    continueShopping: string
    callCenterNotice: string
  }
  footer: {
    about: string
    aboutText: string
    quickLinks: string
    customerCare: string
    terms: string
    privacy: string
    returnPolicy: string
    supportPhone: string
    supportEmail: string
    allRightsReserved: string
    paymentMethods: string
  }
}

export const dictionaries: Record<Locale, Dictionary> = {
  en: {
    nav: {
      home: 'Home',
      categories: 'Categories',
      searchPlaceholder: 'Search products in English or বাংলা...',
      cart: 'Cart',
      trackOrder: 'Track Order',
      language: 'Language',
    },
    home: {
      heroBadge: 'Fast Home Delivery in 64 Districts',
      heroTitle: 'Authentic Bangladeshi Products,',
      heroHighlight: 'Delivered to Your Doorstep',
      heroSubtitle: 'Handcrafted leather footwear, premium Tangail cotton panjabis, and cold-pressed groceries with Cash on Delivery.',
      shopNow: 'Browse Collection',
      categoriesTitle: 'Shop by Category',
      categoriesSubtitle: 'Explore our curated collections crafted for Bangladesh.',
      featuredTitle: 'Featured Products',
      featuredSubtitle: 'Handpicked quality products with best value pricing.',
      viewAll: 'View All',
      trustCod: 'Cash on Delivery',
      trustCodDesc: 'Pay with cash upon delivery anywhere in Bangladesh.',
      trustDelivery: 'Fast Shipping',
      trustDeliveryDesc: 'Inside Dhaka in 24-48 hours, outside Dhaka in 3-5 days.',
      trustOriginal: '100% Genuine',
      trustOriginalDesc: 'Directly sourced from trusted artisans and mills.',
      trustSupport: 'Dedicated Support',
      trustSupportDesc: 'Friendly customer service via phone & WhatsApp.',
    },
    catalog: {
      allProducts: 'All Products',
      noProducts: 'No products found',
      noProductsDesc: 'There are currently no items available in this category.',
      inStock: 'In Stock',
      outOfStock: 'Out of Stock',
      lowStock: 'Low Stock',
      saleBadge: 'OFF',
      filterCategory: 'Categories',
      sortBy: 'Sort by',
      priceLowHigh: 'Price: Low to High',
      priceHighLow: 'Price: High to Low',
    },
    pdp: {
      sku: 'SKU',
      brand: 'Brand',
      origin: 'Country of Origin',
      warranty: 'Warranty',
      nonReturnable: 'Non-returnable item (Perishable/Hygiene)',
      returnable: 'Eligible for return review within 7 days',
      selectVariant: 'Select Option',
      quantity: 'Quantity',
      addToCart: 'Add to Cart',
      buyNow: 'Buy Now',
      deliveryEstimate: 'Delivery Charge',
      deliveryNote: 'Calculated at checkout based on district',
      specifications: 'Product Specifications',
      careInstructions: 'Care Instructions',
      description: 'Product Description',
      cartStubNotice: 'Cart & Checkout will be active in Prompt 07',
      outOfStockWarning: 'This variant is currently out of stock and cannot be purchased.',
    },
    cart: {
      title: 'Shopping Cart',
      emptyTitle: 'Your Cart is Empty',
      emptySubtitle: 'Looks like you haven\'t added any items to your cart yet.',
      continueShopping: 'Continue Shopping',
      startShopping: 'Start Shopping',
      item: 'item',
      items: 'items',
      product: 'Product',
      price: 'Price',
      quantity: 'Quantity',
      total: 'Total',
      subtotal: 'Subtotal',
      delivery: 'Delivery Charge',
      deliveryCalculated: 'Calculated at checkout based on district',
      orderTotal: 'Order Total',
      checkout: 'Checkout',
      proceedToCheckout: 'Proceed to Checkout',
      viewCart: 'View Cart',
      remove: 'Remove',
      clearCart: 'Clear Cart',
      addedToCart: 'Added to cart successfully!',
      updatedQuantity: 'Cart quantity updated',
      removedItem: 'Item removed from cart',
      outOfStock: 'This item is currently out of stock',
      insufficientStock: 'Requested quantity exceeds available stock',
      invalidQuantity: 'Please specify a valid quantity',
      errorOccurred: 'An error occurred. Please try again.',
    },
    checkout: {
      title: 'Order Review & Checkout',
      subtitle: 'Review your selected items and provide delivery details',
      customerInfo: 'Customer Information',
      guestNotice: 'Guest Checkout (No account creation required)',
      firstName: 'First Name',
      lastName: 'Last Name',
      phone: 'Mobile Number',
      phonePlaceholder: '017XXXXXXXX',
      phoneHelp: 'Valid 11-digit Bangladesh mobile number (e.g. 017...)',
      altPhone: 'Alternative Mobile Number (Optional)',
      deliveryAddress: 'Delivery Address',
      division: 'Division',
      selectDivision: 'Select Division',
      district: 'District',
      selectDistrict: 'Select District',
      thana: 'Upazila / Thana',
      selectThana: 'Select Upazila / Thana',
      streetAddress: 'Area / Street / House / Road',
      streetPlaceholder: 'House 12, Road 4, Sector 7, Uttara',
      postalCode: 'Postal Code',
      deliveryZone: 'Delivery Zone',
      deliveryFee: 'Delivery Fee',
      paymentMethod: 'Payment Method',
      cod: 'Cash on Delivery (COD)',
      codNotice: 'Pay with cash upon delivery of your parcel',
      bkash: 'bKash (Coming in Prompt 09)',
      nagad: 'Nagad (Coming in Prompt 09)',
      orderReview: 'Order Review',
      confirmDetails: 'Confirm Delivery Details',
      handoffBannerTitle: 'Prompt 08 Active: Checkout & Delivery Zones',
      handoffBannerDesc: '4-tier Bangladesh address collection and configuration-driven delivery charges are verified. Prompt 09 will finalize COD order placement.',
      priceChangedNotice: 'Price has been updated by the merchant',
      acknowledgePrice: 'Acknowledge & Update Price',
      outOfStockNotice: 'This item is currently out of stock',
      insufficientStockNotice: 'Requested quantity exceeds available stock',
      validating: 'Validating & Updating...',
      successReady: 'Address & delivery zone verified! Ready for order placement.',
      phoneError: 'Please enter a valid 11-digit Bangladesh mobile number.',
      addressError: 'Please complete all required address tiers.',
      placeCodOrder: 'Place Order (Cash on Delivery)',
    },
    orderConfirmation: {
      title: 'Order Confirmed!',
      subtitle: 'Thank you for your order. We have received your order request.',
      orderId: 'Order ID',
      orderDate: 'Date',
      paymentMethod: 'Payment Method',
      cod: 'Cash on Delivery (COD)',
      codNotice: 'Please prepare the exact cash amount upon delivery. Our agent will call to confirm your order before dispatch.',
      customerInfo: 'Delivery Details',
      recipient: 'Recipient',
      phone: 'Phone',
      address: 'Delivery Address',
      deliveryZone: 'Delivery Zone',
      items: 'Ordered Items',
      product: 'Product',
      quantity: 'Qty',
      price: 'Price',
      subtotal: 'Subtotal',
      deliveryFee: 'Delivery Fee',
      total: 'Total Collectable Amount',
      trackOrder: 'Track Your Order',
      trackNotice: 'You can check your order status using your Order ID and phone number.',
      continueShopping: 'Continue Shopping',
      callCenterNotice: 'Our call center will contact you within 24 hours to confirm this order.',
    },
    footer: {
      about: 'About BD Commerce',
      aboutText: 'The premier single-vendor e-commerce platform in Bangladesh, delivering authentic lifestyle, fashion, and grocery products nationwide.',
      quickLinks: 'Quick Links',
      customerCare: 'Customer Support',
      terms: 'Terms of Service',
      privacy: 'Privacy Policy',
      returnPolicy: 'Return & Refund Policy',
      supportPhone: '+880 1700-000000',
      supportEmail: 'support@bdcommerce.com',
      allRightsReserved: 'All rights reserved.',
      paymentMethods: 'Accepted Payment Methods: Cash on Delivery, bKash, Nagad',
    },
  },
  bn: {
    nav: {
      home: 'হোম',
      categories: 'ক্যাটাগরি',
      searchPlaceholder: 'পণ্য খুঁজুন ইংরেজি বা বাংলায়...',
      cart: 'কার্ট',
      trackOrder: 'অর্ডার ট্র্যাক',
      language: 'ভাষা',
    },
    home: {
      heroBadge: '৬৪ জেলায় দ্রুততম হোম ডেলিভারি',
      heroTitle: 'বাংলাদেশের খাঁটি পণ্য,',
      heroHighlight: 'সরাসরি আপনার ঠিকানায়',
      heroSubtitle: 'হাতে তৈরি খাঁটি চামড়ার জুতা, টাঙ্গাইলের সুতি পাঞ্জাবি এবং ঘানিভাঙ্গা খাঁটি সরিষার তেল। ক্যাশ অন ডেলিভারি সুবিধা।',
      shopNow: 'পণ্যসমূহ দেখুন',
      categoriesTitle: 'ক্যাটাগরি অনুযায়ী কেনাকাটা',
      categoriesSubtitle: 'আপনার দৈনন্দিন ও উৎসবের সেরা কালেকশন।',
      featuredTitle: 'সেরা নির্বাচিত পণ্য',
      featuredSubtitle: 'সেরা মান ও সাশ্রয়ী মূল্যের বিশেষ কালেকশন।',
      viewAll: 'সবগুলো দেখুন',
      trustCod: 'ক্যাশ অন ডেলিভারি',
      trustCodDesc: 'পণ্য হাতে পেয়ে মূল্য পরিশোধের নির্ভরযোগ্য সুবিধা।',
      trustDelivery: 'দ্রুত ডেলিভারি',
      trustDeliveryDesc: 'ঢাকায় ২৪-৪৮ ঘণ্টায় এবং ঢাকার বাইরে ৩-৫ দিনে ডেলিভারি।',
      trustOriginal: '১০০% খাঁটি পণ্য',
      trustOriginalDesc: 'দক্ষ কারিগর ও নির্ভরযোগ্য মিল থেকে সরাসরি সংগৃহীত।',
      trustSupport: 'সার্বক্ষণিক সহায়তা',
      trustSupportDesc: 'ফোন ও হোয়াটসঅ্যাপে সার্বক্ষণিক কাস্টমার কেয়ার।',
    },
    catalog: {
      allProducts: 'সকল পণ্য',
      noProducts: 'কোনো পণ্য পাওয়া যায়নি',
      noProductsDesc: 'এই ক্যাটাগরিতে বর্তমানে কোনো পণ্য স্টক নেই।',
      inStock: 'স্টকে আছে',
      outOfStock: 'স্টক শেষ',
      lowStock: 'সীমিত স্টক',
      saleBadge: 'ছাড়',
      filterCategory: 'ক্যাটাগরিসমূহ',
      sortBy: 'সাজান',
      priceLowHigh: 'মূল্য: কম থেকে বেশি',
      priceHighLow: 'মূল্য: বেশি থেকে কম',
    },
    pdp: {
      sku: 'এসকেইউ',
      brand: 'ব্র্যান্ড',
      origin: 'উৎস দেশ',
      warranty: 'ওয়ারেন্টি',
      nonReturnable: 'পরিবর্তনযোগ্য নয় (পচনশীল/স্বাস্থ্যবিধি)',
      returnable: '৭ দিনের মধ্যে রিটার্ন পর্যালোচনার উপযোগী',
      selectVariant: 'অপশন নির্বাচন করুন',
      quantity: 'পরিমাণ',
      addToCart: 'কার্টে যোগ করুন',
      buyNow: 'এখনই কিনুন',
      deliveryEstimate: 'ডেলিভারি চার্জ',
      deliveryNote: 'চেকআউটে জেলা অনুযায়ী নির্ধারিত হবে',
      specifications: 'পণ্যের বিবরণ ও বৈশিষ্ট্য',
      careInstructions: 'ব্যবহার ও যত্নের নির্দেশিকা',
      description: 'পণ্যের বিবরণ',
      cartStubNotice: 'কার্ট ও চেকআউট প্রম্পট ০৭-এ সচল হবে',
      outOfStockWarning: 'এই অপশনটির স্টক বর্তমানে শেষ, তাই ক্রয় করা সম্ভব নয়।',
    },
    cart: {
      title: 'শপিং কার্ট',
      emptyTitle: 'আপনার কার্ট খালি',
      emptySubtitle: 'আপনার শপিং কার্টে এখনও কোনো পণ্য যুক্ত করেননি।',
      continueShopping: 'আরও কেনাকাটা করুন',
      startShopping: 'কেনাকাটা শুরু করুন',
      item: 'টি পণ্য',
      items: 'টি পণ্য',
      product: 'পণ্য',
      price: 'মূল্য',
      quantity: 'পরিমাণ',
      total: 'মোট',
      subtotal: 'সাবটোটাল',
      delivery: 'ডেলিভারি চার্জ',
      deliveryCalculated: 'চেকআউটে জেলা অনুযায়ী নির্ধারিত হবে',
      orderTotal: 'সর্বমোট',
      checkout: 'চেকআউট',
      proceedToCheckout: 'চেকআউটে যান',
      viewCart: 'কার্ট দেখুন',
      remove: 'মুছে ফেলুন',
      clearCart: 'কার্ট খালি করুন',
      addedToCart: 'পণ্যটি কার্টে যুক্ত হয়েছে!',
      updatedQuantity: 'পরিমাণ পরিবর্তন করা হয়েছে',
      removedItem: 'পণ্যটি কার্ট থেকে সরানো হয়েছে',
      outOfStock: 'এই পণ্যটি বর্তমানে স্টক আউট',
      insufficientStock: 'অনুরোধকৃত পরিমাণ বিদ্যমান স্টকের চেয়ে বেশি',
      invalidQuantity: 'সঠিক পরিমাণ উল্লেখ করুন',
      errorOccurred: 'ত্রুটি ঘটেছে, অনুগ্রহ করে আবার চেষ্টা করুন',
    },
    checkout: {
      title: 'অর্ডার পর্যালোচনা ও চেকআউট',
      subtitle: 'আপনার পণ্যসমূহ পর্যালোচনা করুন ও ডেলিভারির তথ্য দিন',
      customerInfo: 'গ্রাহকের তথ্য',
      guestNotice: 'গেস্ট চেকআউট (অ্যাকাউন্ট তৈরির প্রয়োজন নেই)',
      firstName: 'নামের প্রথম অংশ',
      lastName: 'নামের শেষ অংশ',
      phone: 'মোবাইল নম্বর',
      phonePlaceholder: '০১৭XXXXXXXX',
      phoneHelp: 'সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন (যেমন ০১৭...)',
      altPhone: 'বিকল্প মোবাইল নম্বর (ঐচ্ছিক)',
      deliveryAddress: 'ডেলিভারি ঠিকানা',
      division: 'বিভাগ',
      selectDivision: 'বিভাগ নির্বাচন করুন',
      district: 'জেলা',
      selectDistrict: 'জেলা নির্বাচন করুন',
      thana: 'উপজেলা / থানা',
      selectThana: 'উপজেলা / থানা নির্বাচন করুন',
      streetAddress: 'এলাকা / বাড়ি / রোড / ল্যান্ডমার্ক',
      streetPlaceholder: 'বাড়ি ১২, রোড ৪, সেক্টর ৭, উত্তরা',
      postalCode: 'পোস্ট কোড',
      deliveryZone: 'ডেলিভারি জোন',
      deliveryFee: 'ডেলিভারি চার্জ',
      paymentMethod: 'পেমেন্ট পদ্ধতি',
      cod: 'ক্যাশ অন ডেলিভারি (COD)',
      codNotice: 'পণ্য হাতে পেয়ে নগদ টাকায় মূল্য পরিশোধ করুন',
      bkash: 'বিকাশ (প্রম্পট ০৯-এ কার্যকর হবে)',
      nagad: 'নগদ (প্রম্পট ০৯-এ কার্যকর হবে)',
      orderReview: 'অর্ডার পর্যালোচনা',
      confirmDetails: 'ডেলিভারির তথ্য নিশ্চিত করুন',
      handoffBannerTitle: 'প্রম্পট ০৮: চেকআউট ও ডেলিভারি জোন সক্রিয়',
      handoffBannerDesc: '৪-স্তর বিশিষ্ট বাংলাদেশ ঠিকানা এবং কনফিগারেশন নির্ভর ডেলিভারি চার্জ যাচাইকৃত। প্রম্পট ০৯-এ ক্যাশ অন ডেলিভারি অর্ডার চূড়ান্ত হবে।',
      priceChangedNotice: 'দোকান কর্তৃক পণ্যের মূল্য পরিবর্তিত হয়েছে',
      acknowledgePrice: 'পরিবর্তিত মূল্য নিশ্চিত করুন',
      outOfStockNotice: 'এই পণ্যটি বর্তমানে স্টক আউট',
      insufficientStockNotice: 'অনুরোধকৃত পরিমাণ বিদ্যমান স্টকের চেয়ে বেশি',
      validating: 'যাচাই করা হচ্ছে...',
      successReady: 'ঠিকানা ও ডেলিভারি জোন যাচাই সম্পন্ন! অর্ডার প্রস্তুত।',
      phoneError: 'সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন',
      addressError: 'অনুগ্রহ করে ঠিকানার সবকটি স্তর পূরণ করুন।',
      placeCodOrder: 'অর্ডার কনফার্ম করুন (ক্যাশ অন ডেলিভারি)',
    },
    orderConfirmation: {
      title: 'অর্ডার সফলভাবে গৃহীত হয়েছে!',
      subtitle: 'আপনার অর্ডারের জন্য ধন্যবাদ। আমরা আপনার অনুরোধটি গ্রহণ করেছি।',
      orderId: 'অর্ডার আইডি',
      orderDate: 'তারিখ',
      paymentMethod: 'পেমেন্ট পদ্ধতি',
      cod: 'ক্যাশ অন ডেলিভারি (COD)',
      codNotice: 'পার্সেল পাওয়ার পর নগদ মূল্য পরিশোধ করুন। পার্সেল পাঠানোর আগে আমাদের প্রতিনিধি ফোন করে অর্ডারটি কনফার্ম করবেন।',
      customerInfo: 'ডেলিভারি বিবরণ',
      recipient: 'গ্রাহকের নাম',
      phone: 'মোবাইল নম্বর',
      address: 'ডেলিভারি ঠিকানা',
      deliveryZone: 'ডেলিভারি জোন',
      items: 'অর্ডারের পণ্যসমূহ',
      product: 'পণ্য',
      quantity: 'পরিমাণ',
      price: 'মূল্য',
      subtotal: 'সাবটোটাল',
      deliveryFee: 'ডেলিভারি চার্জ',
      total: 'সর্বমোট প্রদেয় মূল্য',
      trackOrder: 'অর্ডার ট্র্যাক করুন',
      trackNotice: 'আপনার অর্ডার আইডি এবং মোবাইল নম্বর দিয়ে যে কোনো সময় অর্ডারের অবস্থা দেখতে পারবেন।',
      continueShopping: 'আরও কেনাকাটা করুন',
      callCenterNotice: 'অর্ডারটি চূড়ান্ত করতে আমাদের কল সেন্টার প্রতিনিধি আগামী ২৪ ঘণ্টার মধ্যে আপনার সাথে যোগাযোগ করবেন।',
    },
    footer: {
      about: 'বিডি কমার্স সম্পর্কে',
      aboutText: 'বাংলাদেশের বিশ্বস্ত একক-ভেন্ডর ই-কমার্স প্ল্যাটফর্ম। প্রিমিয়াম লাইফস্টাইল, ফ্যাশন ও মুদি পণ্য ৬৪ জেলায় নিরাপদে পৌঁছে দিচ্ছি।',
      quickLinks: 'প্রয়োজনীয় লিংক',
      customerCare: 'কাস্টমার কেয়ার',
      terms: 'ব্যবহারের শর্তাবলী',
      privacy: 'গোপনীয়তা নীতি',
      returnPolicy: 'রিটার্ন ও রিফান্ড নীতি',
      supportPhone: '+৮৮০ ১৭০০-০০০০০০',
      supportEmail: 'support@bdcommerce.com',
      allRightsReserved: 'সর্বস্বত্ব সংরক্ষিত।',
      paymentMethods: 'মূল্য পরিশোধ মাধ্যম: ক্যাশ অন ডেলিভারি, বিকাশ, নগদ',
    },
  },
}

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale] || dictionaries[DEFAULT_LOCALE]
}

/**
 * Format BDT currency.
 * In English: ৳ 1,200
 * In Bangla: ৳ ১,২০০
 */
export function formatBdt(amount: number | null | undefined, locale: Locale = 'en'): string {
  if (amount == null || isNaN(amount)) return ''
  const formattedEn = Math.round(amount).toLocaleString('en-US')
  if (locale === 'bn') {
    const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯']
    const bnNum = formattedEn.replace(/[0-9]/g, (d) => bnDigits[Number(d)])
    return `৳ ${bnNum}`
  }
  return `৳ ${formattedEn}`
}

/**
 * Format percentage discount.
 * In English: 20% OFF
 * In Bangla: ২০% ছাড়
 */
export function formatDiscount(percent: number, locale: Locale = 'en'): string {
  if (locale === 'bn') {
    const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯']
    const bnPercent = String(Math.round(percent)).replace(/[0-9]/g, (d) => bnDigits[Number(d)])
    return `${bnPercent}% ছাড়`
  }
  return `${Math.round(percent)}% OFF`
}
