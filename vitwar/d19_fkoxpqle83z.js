// ============================================================
// ترجمة واجهة الموقع (عربي / إنجليزي)
// ملاحظة: النصوص دي بتغطي كل عناصر الواجهة الثابتة (أزرار، عناوين،
// تسميات، رسايل تنبيه...). أسماء وأوصاف الأصناف والتصنيفات نفسها
// بتيجي من لوحة الأدمن زي ما هي، لأن مفيش نسخة إنجليزية متخزنة
// لكل صنف لسه في قاعدة البيانات.
// ============================================================

const I18N = {
  ar: {
    branchSelectTitle: "اختيار الفرع",
    branchSelectHint: "اختار أقرب فرع ليك",
    cartBtn: "السلة",
    cartTitle: "سلتك",
    total: "الإجمالي",
    checkoutBtn: "إتمام الطلب",
    productModalTitle: "تخصيص الطلب",
    addToCartBtn: "أضف للسلة",
    checkoutModalTitle: "إتمام الطلب",
    chooseOrderType: "اختار طريقة استلام طلبك",
    orderTypeCafe: "كافيه",
    orderTypeDelivery: "توصيل",
    orderTypePickup: "استلام",
    supportTitle: "الدعم",
    supportFormHint: "قبل ما نبدأ، محتاجين بياناتك",
    nameLabel: "الاسم",
    namePlaceholder: "اكتب اسمك",
    phoneLabel: "رقم الموبايل",
    startChatBtn: "ابدأ المحادثة",
    chatPlaceholder: "اكتب رسالتك...",
    browseSupport: "تواصل مع الدعم",
    browseLocation: "العنوان",
    locationModalTitle: "العنوان",
    locationOpenInMaps: "فتح في خرائط جوجل",
    locationSeeYouSoon: "See you soon !",
    browseInstall: "تثبيت التطبيق",
    browseAbout: "من نحن",
    browseMessages: "الرسائل",
    browseFavorites: "المفضلة",
    browseMyOrders: "طلباتي",
    favEmpty: "لسه مفيش أصناف في المفضلة",
    favAddedToast: "اتضاف للمفضلة ❤️",
    favRemovedToast: "اتشال من المفضلة",
    myOrdersEmpty: "لسه مفيش طلبات",
    reorderBtn: "إعادة الطلب",
    reorderAddedToast: "تم إضافة الأصناف للسلة",
    reorderUnavailableToast: "الأصناف دي مش متاحة دلوقتي",
    orderTrackingTitle: "تتبع الأوردر",
    orderReceivedBtn: "تم الاستلام",
    orderReceivedDone: "تم الاستلام ✅",
    orderReceivedThanks: "تمام، بالهنا والشفا 😋",
    orderStage0: "تم ارسال الاوردر",
    orderStage25: "تم الاطلاع على الاوردر",
    orderStage50: "جاري تحضير الاوردر",
    orderStage75: "تم تحضير الاوردر",
    orderStage100: "تم تسليم الاوردر",
    browseLang: "اللغة / Language",
    menuTooltip: "القائمة",
    browseLabel: "بحث",
    browseChangeBranch: "تغيير الفرع",
    aboutSubtitle: "من نحن",
    messagesInboxTitle: "الرسائل",
    messagesInboxEmpty: "مفيش رسائل لسه",
    messagesClearAll: "مسح كل الرسائل",
    messagesClearAllConfirm: "هيتمسح كل الرسائل من عندك، تمام؟",
    messagesDeleteOne: "مسح الرسالة دي",
    footer: "جميع الحقوق محفوظة لـ Vitwar © 2026 ",

    categoryAll: "الكل",
    categoryOffers: "🎁 العروض",
    categoryBirthdays: "🎂 أعياد الميلاد",
    categoryAddons: "✨ الإضافات",
    noProductsInCategory: "لا يوجد أصناف في هذا التصنيف حاليًا",
    noOffersInCategory: "لا يوجد عروض حاليًا",
    unavailableBadge: "غير متاح حاليًا",
    soldOutRibbon: "نفذت الكمية",
    productUnavailableToast: "المنتج ده مش متاح للطلب حاليًا 🙁",
    stockLimitToast: "الكمية المتاحة {stock} بس 🙁",
    priceFrom: "من",
    currency: "ج.م",
    chooseBtn: "اختيار",
    qtyLabel: "الكمية",
    addonsTitle: "إضافات مميزة (اختياري)",
    searchAddonsPlaceholder: "ابحث عن إضافة...",
    noAddonsFound: "لا يوجد إضافات مطابقة للبحث",
    addAddonBtn: "+ إضافة",
    cartEmptyForAddonToast: "لازم تطلب صنف الأول عشان تقدر تضيفله إضافة",
    attachAddonTitle: "اختار الصنف اللي عايز تضيف له الإضافة",
    attachAddonCartHint: "دوس على الصنف اللي عايز تضيف له",
    addonAttachedToast: "تمت إضافة {addon} إلى {item} ✅",

    browseGoogleSignIn: "تسجيل الدخول بواسطة Google",
    browseGoogleSignOut: "تسجيل الخروج",
    googleSignInError: "حصل خطأ في تسجيل الدخول، حاول تاني",
    googleSignInSuccess: "تم تسجيل الدخول بنجاح ✅",
    googleSignOutSuccess: "تم تسجيل الخروج",
    browsePhoneSignIn: "تسجيل الدخول برقم الهاتف",
    browseCustomerLogin: "تسجيل الدخول",
    browseCustomerSignup: "إنشاء حساب",
    browseCustomerLogout: "تسجيل الخروج",
    browseCustomerLogoutPrefix: "تسجيل الخروج -",
    signInLoginLabel: "تسجيل الدخول",
    customerSignupTitle: "إنشاء حساب",
    customerSignupSub: "بيانات حسابك هتتحفظ عشان متكتبهاش كل مرة",
    customerLoginTitle: "تسجيل الدخول",
    customerLoginSub: "ادخل برقم موبايلك والباسورد اللي اخترته",
    customerAuthPhoneSub: "هنبعتلك كود تأكيد على رقمك",
    customerAuthSwitchToLogin: "عندك حساب بالفعل؟ سجل دخول",
    customerAuthSwitchToSignup: "لسه معملتش حساب؟ سجل دلوقتي",
    customerSignupBtn: "إنشاء الحساب",
    customerLoginBtn: "دخول",
    customerPasswordPlaceholder: "كلمة المرور",
    customerPasswordConfirmPlaceholder: "تأكيد كلمة المرور",
    customerNewPasswordPlaceholder: "كلمة المرور الجديدة",
    customerSaveNewPasswordBtn: "حفظ كلمة المرور",
    customerForgotPassword: "نسيت كلمة المرور؟",
    customerForgotPasswordTitle: "استعادة كلمة المرور",
    authNewPasswordSub: "أدخل كلمة مرور جديدة لحسابك",
    customerPasswordUpdated: "تم تحديث كلمة المرور ✅",
    customerErrPasswordShort: "كلمة المرور لازم تكون 6 حروف/أرقام على الأقل",
    customerErrPasswordMismatch: "كلمتا المرور مش متطابقتين",
    customerErrPhoneTaken: "الرقم ده متسجل بحساب قبل كده، جرب تسجيل الدخول",
    customerErrGeneric: "حصل خطأ، حاول تاني",
    customerErrLoginFailed: "الرقم أو كلمة المرور غلط",
    customerSignupSuccess: "تم إنشاء حسابك بنجاح ✅",
    customerLoginSuccess: "تم تسجيل الدخول ✅",
    customerLogoutSuccess: "تم تسجيل الخروج",
    googleSignInUnavailable: "تسجيل الدخول مش متاح دلوقتي",
    phoneNumberPlaceholder: "رقم هاتفك",
    sendCodeBtn: "إرسال الكود",
    authOrContinueWith: "أو تابع باستخدام",
    continueWithGoogle: "جوجل",
    authNoAccountYet: "ليس لديك حساب؟",
    authOtpTitle: "أدخل كود التحقق",
    authOtpTitleSub: "خطوة أخيرة بسيطة",
    authOtpSentTo: "تم إرسال كود مكوّن من 6 أرقام إلى",
    verifyCodeBtn: "تأكيد الكود",
    authResendCode: "إعادة إرسال الكود",
    authChangeNumber: "تغيير الرقم",
    authPhoneInvalid: "رقم الهاتف مش صحيح",
    authOtpInvalid: "الكود غلط أو منتهي، جرب تاني",
    authCodeSent: "تم إرسال الكود 📩",
    yourAccountLabel: "حسابك",
    branchLoginBoxTitle: "سجّل دخولك الأول",
    branchLoginBoxSub: "لازم تسجل دخول عشان تطلب أو تكتب تقييم",
    branchLoginBoxSubIn: "أهلاً بيك، اطلب واستمتع 🎉",
    branchLoginBoxWelcome: "أهلاً بيك",
    branchLoginBoxWelcomeNoName: "تم تسجيل الدخول ✅",
    loginRequiredOrder: "لازم تسجل دخول الأول عشان تقدر تطلب",
    loginRequiredReview: "لازم تسجل دخول الأول عشان تقدر تكتب تقييم",

    emptyCart: "السلة فاضية دلوقتي",
    branchClosedMsg: "الفرع مقفول دلوقتي، مينفعش تطلب حاليًا. جرب تاني بعدين 🙏",
    statusBusyMsg: "🟠 المحل مشغول شوية دلوقتي — تقدر تطلب عادي وطلبك هيتنفذ أول ما يتاح",
    deliveryUnavailableMsg: "من المحتمل مفيش مندوب توصيل الآن، ممكن تطلب من طلبات أو ممكن تتوجه إلى فرعنا 🙏",
    deliveryUnavailableTalabatBtn: "اطلب من طلبات",
    deliveryUnavailableCloseBtn: "إغلاق",

    cafeNameLabel: "اسم الكافيه",
    cafeNamePlaceholder: "اسم الكافيه",
    addressLabel: "العنوان بالتفصيل",
    addressPlaceholder: "العنوان...",
    pickupTimeLabel: "الوقت المتوقع للاستلام",
    pickup15: "15 دقيقة",
    pickup30: "30 دقيقة",
    pickup60: "1 ساعة",
    mobileNumberLabel: "رقم موبايلك",
    paymentMethodLabel: "طريقة الدفع",
    paymentCash: "💵 كاش",
    paymentCashCaption: "كاش",
    paymentInstapay: "💳 انستاباي",
    paymentInstapayCaption: "انستاباي",
    openInstapayLinkBtn: "افتح لينك الدفع",
    commentLabel: "تعليق (اختياري)",
    commentPlaceholder: "أي ملاحظة على الطلب... (اختياري)",
    confirmOrderBtn: "تأكيد الطلب",
    backBtn: "رجوع",
    sendingOrderBtn: "جاري إرسال الطلب...",
    errCafeName: "من فضلك اكتب اسم الكافيه",
    errAddress: "من فضلك اكتب العنوان",
    errPhone: "من فضلك اكتب رقم موبايل صحيح",
    errPayment: "من فضلك اختار طريقة الدفع",
    errOrderGeneric: "حصل خطأ في إرسال الطلب، حاول تاني",
    orderSuccessBusy: "تم استلام طلبك وكوده #{code} ✅\nالمحل مشغول شوية دلوقتي، هيتم تجهيز طلبك أول ما يتاح.",
    orderSuccessMsg: "تم إرسال طلبك بنجاح ✅ كود طلبك #{code}",

    installIosMsg: 'لتثبيت التطبيق على آيفون/آيباد: دوس زرار المشاركة ⬆️ تحت في Safari، وبعدين اختار "إضافة إلى الشاشة الرئيسية".',
    installOtherMsg: 'افتح قائمة المتصفح (⋮ فوق يمين) وهتلاقي خيار "تثبيت التطبيق" أو "Install App" / "Install Vitwar".',
    supportSubtitleDefault: "الدعم",
    supportGreeting: "أهلاً {name}",
    supportStartingBtn: "جاري البدء...",
    supportErrName: "من فضلك اكتب اسمك",
    supportErrPhone: "من فضلك اكتب رقم موبايل صحيح",
    supportErrGeneric: "حصل خطأ، حاول تاني",
    supportChatClosedByAdmin: "الدعم قفل المحادثة دي 🔒",
    supportClosedNote: "🔒 المحادثة دي اتقفلت من الدعم",
    newChatBtn: "بدء محادثة جديدة",

    heroBranch1: "تجمع اول",
    heroBranch5: "تجمع خامس",
    aboutUsLabel: "About us",
    closedTitleBig: "الفرع مقفول دلوقتي",
    closedSubtitle: "هنكون في استقبالك تاني قريب — تقدر تختار فرع تاني دلوقتي",
    closedChangeBranchBtn: "اختيار فرع تاني",
    installSheetTitle: "ثبت تطبيق Vitwar",
    installSheetDesc: "الآن يمكنك تثبيت موقعنا كـ تطبيق!",
    installNowBtn: "تثبيت",
    installLaterBtn: "مش دلوقتي",
    offerBadge: "🎁 عرض خاص",

    reviewsBadgeWord: "تقييم",
    reviewsModalTitle: "التقييمات",
    rateUsTitle: "قيّمنا",
    reviewCommentLabel: "تعليقك",
    reviewCommentPlaceholder: "اكتب رأيك في المكان...",
    submitReviewBtn: "إرسال التقييم",
    reviewSubmitSuccess: "شكرًا لتقييمك! ✅",
    reviewSubmitLocalOnly: "اتحفظ على جهازك بس - مش هيبان لباقي العملاء دلوقتي (فيه مشكلة في إعدادات السيرفر)",
    reviewErrStars: "من فضلك اختار تقييمك بالنجوم",
    reviewErrName: "من فضلك اكتب اسمك",
    reviewErrComment: "من فضلك اكتب تعليقك",
    reviewErrDrinks: "احنا مش بنقدم مشروبات، من فضلك اكتب تعليق عن الأكل/الحلويات",

    aboutParagraphs: [
      "فيتوار مش مجرد مطعم... فيتوار تجربة متكاملة اتبنت بشغف وحب للتفاصيل من سنة 2019. من أول يوم كان هدفنا إننا نقدم جودة حقيقية وطعم يفضل في الذاكرة، عشان كل زيارة تكون تجربة تستحق تتكرر.\n\nإحنا بنهتم بكل خطوة، بدايةً من اختيار أفضل المكونات وتحضيرها بعناية، مرورًا بطريقة التجهيز والتغليف، ووصولًا لآخر لمسة في التقديم. لأننا مؤمنين إن التفاصيل الصغيرة هي اللي بتصنع الفرق الكبير.\n\nكل منتج بيخرج من فيتوار معمول بنفس الاهتمام، ونفس الجودة، ونفس الشغف اللي بدأنا بيه رحلتنا. هدفنا إن أول لقمة تخليك تحس بالطعم الحقيقي، وآخر لقمة تخليك مستني زيارتك الجاية.\n\nفيتوار هو المكان اللي بيجمع بين الجودة، والطعم المميز، والتقديم الأنيق، والخدمة اللي تليق بكل عميل. لأن بالنسبة لينا، رضاك مش مجرد هدف... ده أساس كل حاجة بنعملها.\n\nأهلًا بيك في فيتوار... المكان اللي كل تفصيلة فيه معمولة علشان تسيب عندك انطباع مميز من أول تجربة، وتخليك ترجع لنا مرة بعد مرة.",
    ],
  },
  en: {
    branchSelectTitle: "Choose your branch",
    branchSelectHint: "Pick the nearest branch to you",
    cartBtn: "Cart",
    cartTitle: "Your Cart",
    total: "Total",
    checkoutBtn: "Checkout",
    productModalTitle: "Customize order",
    addToCartBtn: "Add to cart",
    checkoutModalTitle: "Checkout",
    chooseOrderType: "Choose how you'd like to get your order",
    orderTypeCafe: "Cafe",
    orderTypeDelivery: "Delivery",
    orderTypePickup: "Pickup",
    supportTitle: "Support",
    supportFormHint: "Before we start, we need a couple of details",
    nameLabel: "Name",
    namePlaceholder: "Your name",
    phoneLabel: "Mobile number",
    startChatBtn: "Start chat",
    chatPlaceholder: "Type your message...",
    browseSupport: "Contact support",
    browseLocation: "Location",
    locationModalTitle: "Location",
    locationOpenInMaps: "Open in Google Maps",
    locationSeeYouSoon: "See you soon !",
    browseInstall: "Install app",
    browseAbout: "About us",
    browseMessages: "Messages",
    browseFavorites: "Favorites",
    browseMyOrders: "My Orders",
    favEmpty: "No favorite items yet",
    favAddedToast: "Added to favorites ❤️",
    favRemovedToast: "Removed from favorites",
    myOrdersEmpty: "No orders yet",
    reorderBtn: "Reorder",
    reorderAddedToast: "Items added to your cart",
    reorderUnavailableToast: "These items aren't available right now",
    orderTrackingTitle: "Track Order",
    orderReceivedBtn: "I received it",
    orderReceivedDone: "Received ✅",
    orderReceivedThanks: "Great, enjoy! 😋",
    orderStage0: "Order sent",
    orderStage25: "Order reviewed",
    orderStage50: "Preparing your order",
    orderStage75: "Order ready",
    orderStage100: "Order delivered",
    browseLang: "Language / اللغة",
    menuTooltip: "Menu",
    browseLabel: "Browse",
    browseChangeBranch: "Change branch",
    aboutSubtitle: "About us",
    messagesInboxTitle: "Messages",
    messagesInboxEmpty: "No messages yet",
    messagesClearAll: "Clear all messages",
    messagesClearAllConfirm: "This will clear all your messages, sure?",
    messagesDeleteOne: "Delete this message",
    footer: "Copyright © - Vitwar — All rights reserved 2026",

    categoryAll: "All",
    categoryOffers: "🎁 Offers",
    categoryBirthdays: "🎂 Birthdays",
    categoryAddons: "✨ Add-ons",
    noProductsInCategory: "No items in this category right now",
    noOffersInCategory: "No offers available right now",
    unavailableBadge: "Currently unavailable",
    soldOutRibbon: "Sold Out",
    productUnavailableToast: "This product isn't available to order right now 🙁",
    stockLimitToast: "Only {stock} available 🙁",
    priceFrom: "From",
    currency: "EGP",
    chooseBtn: "Choose",
    qtyLabel: "Quantity",
    addonsTitle: "Extra add-ons (optional)",
    searchAddonsPlaceholder: "Search add-ons...",
    noAddonsFound: "No add-ons match your search",
    addAddonBtn: "+ Add",
    cartEmptyForAddonToast: "Order an item first so you can add an add-on to it",
    attachAddonTitle: "Choose the item you want to add this to",
    attachAddonCartHint: "Tap the item you want to add it to",
    addonAttachedToast: "{addon} was added to {item} ✅",

    browseGoogleSignIn: "Sign in with Google",
    browseGoogleSignOut: "Sign out",
    googleSignInError: "Something went wrong signing in, please try again",
    googleSignInSuccess: "Signed in successfully ✅",
    googleSignOutSuccess: "Signed out",
    browsePhoneSignIn: "Sign in with phone number",
    browseCustomerLogin: "Log in",
    browseCustomerSignup: "Create account",
    browseCustomerLogout: "Log out",
    browseCustomerLogoutPrefix: "Log out -",
    signInLoginLabel: "Sign in / Login",
    customerSignupTitle: "Create account",
    customerSignupSub: "Your info is saved so you don't type it every time",
    customerLoginTitle: "Sign in / Login",
    customerLoginSub: "Enter your phone number and the password you chose",
    customerAuthPhoneSub: "We'll send a verification code to your number",
    customerAuthSwitchToLogin: "Already have an account? Log in",
    customerAuthSwitchToSignup: "Don't have an account yet? Sign up",
    customerSignupBtn: "Create account",
    customerLoginBtn: "Log in",
    customerPasswordPlaceholder: "Password",
    customerPasswordConfirmPlaceholder: "Confirm password",
    customerNewPasswordPlaceholder: "New password",
    customerSaveNewPasswordBtn: "Save password",
    customerForgotPassword: "Forgot password?",
    customerForgotPasswordTitle: "Reset password",
    authNewPasswordSub: "Enter a new password for your account",
    customerPasswordUpdated: "Password updated ✅",
    customerErrPasswordShort: "Password must be at least 6 characters",
    customerErrPasswordMismatch: "Passwords don't match",
    customerErrPhoneTaken: "This number already has an account - try logging in",
    customerErrGeneric: "Something went wrong, try again",
    customerErrLoginFailed: "Wrong phone number or password",
    customerSignupSuccess: "Account created successfully ✅",
    customerLoginSuccess: "Logged in ✅",
    customerLogoutSuccess: "Logged out",
    googleSignInUnavailable: "Sign-in isn't available right now",
    phoneNumberPlaceholder: "Your phone number",
    sendCodeBtn: "Send code",
    authOrContinueWith: "Or continue with",
    continueWithGoogle: "Google",
    authNoAccountYet: "Don't have an account?",
    authOtpTitle: "Enter verification code",
    authOtpTitleSub: "One last quick step",
    authOtpSentTo: "A 6-digit code was sent to",
    verifyCodeBtn: "Verify code",
    authResendCode: "Resend code",
    authChangeNumber: "Change number",
    authPhoneInvalid: "Invalid phone number",
    authOtpInvalid: "Wrong or expired code, try again",
    authCodeSent: "Code sent 📩",
    yourAccountLabel: "Your account",
    branchLoginBoxTitle: "Sign in first",
    branchLoginBoxSub: "You need to sign in to order or write a review",
    branchLoginBoxSubIn: "Welcome, enjoy your order 🎉",
    branchLoginBoxWelcome: "Welcome",
    branchLoginBoxWelcomeNoName: "You're signed in ✅",
    loginRequiredOrder: "Please sign in first to place an order",
    loginRequiredReview: "Please sign in first to write a review",

    emptyCart: "Your cart is empty right now",
    branchClosedMsg: "This branch is closed right now, you can't order at the moment. Please try again later 🙏",
    statusBusyMsg: "🟠 The place is a bit busy right now — you can still order and we'll get to it as soon as we can",
    deliveryUnavailableMsg: "There's probably no delivery driver available right now — you can order through Talabat or head over to our branch 🙏",
    deliveryUnavailableTalabatBtn: "Order on Talabat",
    deliveryUnavailableCloseBtn: "Close",

    cafeNameLabel: "Cafe name",
    cafeNamePlaceholder: "Cafe name",
    addressLabel: "Full address",
    addressPlaceholder: "Address...",
    pickupTimeLabel: "Expected pickup time",
    pickup15: "15 minutes",
    pickup30: "30 minutes",
    pickup60: "1 hour",
    mobileNumberLabel: "Your mobile number",
    paymentMethodLabel: "Payment method",
    paymentCash: "💵 Cash",
    paymentCashCaption: "Cash",
    paymentInstapay: "💳 InstaPay",
    paymentInstapayCaption: "InstaPay",
    openInstapayLinkBtn: "Open payment link",
    commentLabel: "Comment (optional)",
    commentPlaceholder: "Any note on your order... (optional)",
    confirmOrderBtn: "Confirm order",
    backBtn: "Back",
    sendingOrderBtn: "Sending your order...",
    errCafeName: "Please enter the cafe name",
    errAddress: "Please enter the address",
    errPhone: "Please enter a valid mobile number",
    errPayment: "Please choose a payment method",
    errOrderGeneric: "Something went wrong sending your order, please try again",
    orderSuccessBusy: "Your order was received, code #{code} ✅\nThe place is a bit busy right now, we'll prep your order as soon as we can.",
    orderSuccessMsg: "Your order was sent successfully ✅ your code is #{code}",

    installIosMsg: 'To install the app on iPhone/iPad: tap the Share button ⬆️ in Safari, then choose "Add to Home Screen".',
    installOtherMsg: 'Open your browser menu (⋮ top right) and look for "Install App" / "Install Vitwar".',

    supportSubtitleDefault: "Support",
    supportGreeting: "Hi {name}",
    supportStartingBtn: "Starting...",
    supportErrName: "Please enter your name",
    supportErrPhone: "Please enter a valid mobile number",
    supportErrGeneric: "Something went wrong, please try again",
    supportChatClosedByAdmin: "Support closed this conversation 🔒",
    supportClosedNote: "🔒 This conversation has been closed by support",
    newChatBtn: "Start a new conversation",

    heroBranch1: "First Settlement",
    heroBranch5: "Fifth Settlement",
    aboutUsLabel: "About us",
    closedTitleBig: "This branch is closed right now",
    closedSubtitle: "We'll be back soon — you can pick another branch now",
    closedChangeBranchBtn: "Choose another branch",
    installSheetTitle: "Install the Vitwar app",
    installSheetDesc: "Now you can install this site as an application! ",
    installNowBtn: "Install",
    installLaterBtn: "Not now",
    offerBadge: "🎁 Special offer",

    reviewsBadgeWord: "reviews",
    reviewsModalTitle: "Reviews",
    rateUsTitle: "Rate us",
    reviewCommentLabel: "Your review",
    reviewCommentPlaceholder: "Share your experience...",
    submitReviewBtn: "Submit review",
    reviewSubmitSuccess: "Thanks for your review! ✅",
    reviewSubmitLocalOnly: "Saved on your device only - other customers won't see it yet (server config issue)",
    reviewErrStars: "Please select a star rating",
    reviewErrName: "Please enter your name",
    reviewErrComment: "Please write your review",
    reviewErrDrinks: "We don't serve drinks — please write about the food/desserts instead",

    aboutParagraphs: [
      "Vitwar is more than just a restaurant... it's a complete experience built with passion and attention to every detail since 2019.\n\nFrom day one, our mission has been to deliver exceptional quality and unforgettable flavors, making every visit an experience worth repeating.\n\nWe care about every step of the journey, from carefully selecting the finest ingredients and preparing them with precision, to thoughtful packaging and the final touch of presentation. Because we believe that the smallest details create the biggest difference.\n\nEvery product at Vitwar is crafted with the same dedication, quality, and passion that started our journey. Our goal is for the very first bite to impress you, and the last bite to leave you looking forward to your next visit.\n\nVitwar brings together premium quality, outstanding taste, elegant presentation, and service that exceeds expectations. For us, your satisfaction isn't just a goal... it's the foundation of everything we do.\n\nWelcome to Vitwar... where every detail is designed to create a memorable experience from your very first visit and keep you coming back for more.",
    ],
  },
};

function getSiteLang() {
  return localStorage.getItem("vitwar_lang") || detectDeviceLang();
}
function detectDeviceLang() {
  const nav = (navigator.language || navigator.userLanguage || "ar").toLowerCase();
  return nav.startsWith("ar") ? "ar" : "en";
}

// ---------- هيلبر ترجمة عام: t("key") أو t("key", {name: "..."}) ----------
function t(key, vars) {
  const dict = I18N[getSiteLang()] || I18N.ar;
  let str = dict[key] != null ? dict[key] : (I18N.ar[key] != null ? I18N.ar[key] : key);
  if (vars) {
    Object.keys(vars).forEach((k) => {
      str = str.replace(new RegExp(`\\{${k}\\}`, "g"), vars[k]);
    });
  }
  return str;
}

function applyLang(lang) {
  const dict = I18N[lang] || I18N.ar;
  localStorage.setItem("vitwar_lang", lang);

  document.documentElement.setAttribute("lang", lang);
  document.documentElement.setAttribute("dir", lang === "ar" ? "rtl" : "ltr");
  document.body.style.direction = lang === "ar" ? "rtl" : "ltr";

  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    if (dict[key] != null) el.textContent = dict[key];
  });
  document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
    const key = el.getAttribute("data-i18n-placeholder");
    if (dict[key] != null) el.setAttribute("placeholder", dict[key]);
  });
  document.querySelectorAll("[data-i18n-title]").forEach((el) => {
    const key = el.getAttribute("data-i18n-title");
    if (dict[key] != null) el.setAttribute("title", dict[key]);
  });

  // عنوان شات الدعم الفرعي: يترجم بس لو مفيش محادثة نشطة دلوقتي (عشان مايبوظش اسم العميل)
  const supportSub = document.getElementById("supportChatSubtitle");
  if (supportSub && typeof supportChatId !== "undefined" && !supportChatId) {
    supportSub.textContent = dict.supportSubtitleDefault;
  }

  // خانة اختيار اللغة نفسها
  const codeEn = document.getElementById("langCodeEn");
  const codeAr = document.getElementById("langCodeAr");
  if (codeEn && codeAr) {
    codeEn.classList.toggle("active", lang === "en");
    codeAr.classList.toggle("active", lang === "ar");
  }
  const browseLangValue = document.getElementById("browseLangValue");
  if (browseLangValue) browseLangValue.textContent = lang === "ar" ? "AR" : "EN";

  // إعادة رسم العناصر الديناميكية (كارت، سلة، فرع، حالة الفرع...) عشان تتحدث باللغة الجديدة
  if (typeof renderCartCount === "function") renderCartCount();
  if (typeof renderCategories === "function") renderCategories();
  if (typeof renderProducts === "function") renderProducts();
  if (typeof renderCartDrawer === "function") renderCartDrawer();
  if (typeof updateGoogleAuthUI === "function") updateGoogleAuthUI();
  if (typeof renderStatusStrip === "function") renderStatusStrip();
  if (typeof updateBranchBadge === "function") updateBranchBadge();
  // شاشة اختيار الفرع (أسماء/مواقع الفروع) + نصوص "عننا" + قائمة التقييمات
  // بيتحدثوا هنا عشان لو المستخدم غيّر اللغة وهو جوه الموقع، وبعدين رجع
  // لشاشة اختيار الفرع، يلاقي كل حاجة بنفس اللغة الجديدة
  if (typeof renderBranchOptions === "function") renderBranchOptions();
  if (typeof setAboutUsTexts === "function") setAboutUsTexts(lang);
  if (typeof renderLocationModal === "function") renderLocationModal();
  if (typeof renderReviewsList === "function") renderReviewsList();
  if (typeof renderRatingBadge === "function") renderRatingBadge();
}

// ---------- اسم الصنف/التصنيف باللغة الحالية (خانة عربي + خانة إنجليزي) ----------
function itemDisplayName(item) {
  if (!item) return "";
  const lang = getSiteLang();
  return (lang === "en" && item.nameEn && item.nameEn.trim()) ? item.nameEn : item.name;
}

// ---------- ترجمة تلقائية للوصف (خانة وحدة بالعربي بيتكتبها الأدمن، وبتتترجم من الموقع) ----------
const _vtTranslateCache = (() => {
  try { return JSON.parse(localStorage.getItem("vitwar_translate_cache") || "{}"); }
  catch (e) { return {}; }
})();
function _vtSaveTranslateCache() {
  try { localStorage.setItem("vitwar_translate_cache", JSON.stringify(_vtTranslateCache)); } catch (e) {}
}
async function translateText(text, targetLang) {
  if (!text || !text.trim()) return "";
  if (targetLang === "ar") return text; // النص الأصلي مكتوب بالعربي من الأدمن
  const key = targetLang + "::" + text;
  if (_vtTranslateCache[key]) return _vtTranslateCache[key];
  try {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=ar|en`;
    const res = await fetch(url);
    const data = await res.json();
    const translated = data?.responseData?.translatedText;
    if (translated) {
      _vtTranslateCache[key] = translated;
      _vtSaveTranslateCache();
      return translated;
    }
  } catch (e) {}
  return text; // لو الترجمة فشلت (مثلاً مفيش إنترنت) بنرجع النص الأصلي
}
// بيملأ أي عنصر في الصفحة عليه data-translate بالنص المترجم (بدون ما يعطل عرض النص الأصلي الأول)
function applyAutoTranslate(el, text) {
  if (!el) return;
  el.textContent = text || "";
  const lang = getSiteLang();
  if (lang !== "en" || !text) return;
  translateText(text, "en").then((translated) => {
    if (el.isConnected) el.textContent = translated;
  });
}

function initLangSwitch() {
  applyLang(getSiteLang());
  const box = document.getElementById("langSwitch");
  if (!box || box.dataset.inited) return;
  box.dataset.inited = "1";
  box.addEventListener("click", () => {
    const current = getSiteLang();
    const next = current === "ar" ? "en" : "ar";
    box.classList.remove("lang-flip");
    void box.offsetWidth;
    box.classList.add("lang-flip");
    applyLang(next);
  });
}
document.addEventListener("DOMContentLoaded", initLangSwitch);
if (document.readyState === "interactive" || document.readyState === "complete") {
  initLangSwitch();
}
