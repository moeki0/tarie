import type { Messages } from "./ja";

export const en: Messages = {
  // Navigation / Actions
  logout: "Log out",
  getStarted: "Get Started",
  loginWithGoogle: "Log in with Google",
  viewSample: "View Sample",
  back: "Back",
  view: "View",
  delete: "Delete",
  confirmDelete: "Delete",
  cancel: "Cancel",
  edit: "Edit",
  preview: "Preview",
  image: "Image",
  uploading: "Uploading",
  editor: "Editor",
  desk: "Desk",
  settings: "Settings",

  // Aria labels
  ariaAccountMenu: "Account menu",
  ariaGoHome: "Go home",
  ariaEditMode: "Edit mode",
  ariaPrevPage: "Previous page",
  ariaNextPage: "Next page",
  ariaGoToPage: "Go to page {n}",

  // Empty states
  noBooksYet: "No books yet.",
  createFirstBook: "Create your first book",
  createNewBook: "Create a new book",
  creatingBook: "Creating book…",
  noPagesYet: "No pages yet.",
  bookNotFound: "Book not found.",
  untitled: "Untitled",

  // Delete dialog
  deleteConfirmMessage: "Delete this book?",

  // Form labels
  coverPattern: "Cover Pattern",
  coverPatternDefault: "(Default)",
  author: "Author",
  authorPlaceholder: "Author name",
  pageTransition: "Page Transition",
  font: "Font",
  photoMargin: "Photo Margin",
  maxImageHeight: "Max Image Height",
  background: "Background",
  backgroundWhite: "White",
  backgroundBlack: "Black",

  // Editor placeholder
  placeholderCoverTitle: "Cover Title",
  placeholderBodyFirstPage: "First page content",
  placeholderBodyContinuation: "Continuation (same page)",

  // Upload
  emptyEditorDropHint: "Drop images to get started",
  emptyEditorOrBrowse: "or click to browse",
  deskEmpty: "Drop or click to add photos",
  deskInsert: "Add to manuscript",
  deskSelectCount: "{n} selected",
  dropImageToUpload: "Drop image to upload",
  dropImageFilePlease: "Please drop an image file",
  uploadFailed: "Upload failed",

  // Credit page
  creditPrefix: "This book was made with",
  creditSuffix: "",
  goToPrevPage: "Previous page",
  goToCover: "Back to cover",

  // Landing page
  heroTagline: "Two photos side by side, and a space appears.",
  featureWriteTitle: "The magic of pairing",
  featureWriteDesc:
    "One photo is a picture. Two together become a place. A photo book is a device that creates stories between images.",
  featurePhotoTitle: "Pages create relationships",
  featurePhotoDesc:
    "Morning and night, landscape and detail, people and streets. What you place next to a photo changes everything.",
  featureShareTitle: "Share in seconds",
  featureShareDesc:
    "One URL for anyone. No login required to view — your own personal book.",
  footerCta: "Pair your photos. Create a space.",

  // Metadata
  metaTitleDefault: "tarie - A home for photos that don't go viral",
  metaDescription:
    "tarie is a service that gives your quiet photos a home. Arrange them into a photo book and share it with anyone via URL.",
  metaOgDescription:
    "A home for photos that don't go viral. Arrange them into a photo book and share via URL.",
  metaAboutTitle: "A home for photos that don't go viral",
  metaSampleTitle: "Sample",
  metaSampleDescription: "A sample photo book created with tarie.",
  metaEditSuffix: "Edit",


  // Syntax guide
  syntaxGuide: "Syntax Guide",
  syntaxGuideLink: "Syntax Guide",

  // Publishing
  publish: "Publish",
  unpublish: "Unpublish",
  publishSettings: "Settings",
  publishSuccess: "Published",
  draft: "Draft",
  visibilityUrlOnly: "Anyone with URL",
  visibilityUrlOnlyDesc: "Only people with the link can view",
  visibilityPassword: "Password",
  visibilityPasswordDesc: "Only people with the password can view",
  visibilityPrivate: "Only me",
  visibilityPrivateDesc: "Only you can view this book",
  passwordPlaceholder: "Enter password",
  publishedAt: "Published",
  published: "Published",
  viewPublished: "Published",
  notPublishedYet: "Not published yet",
  draftPreview: "Draft Preview",
  unpublishedChanges: "Same as published",
  diffTitle: "Changes",
  diffClose: "Close",
  diffNoPublished: "Not published yet",
  diffLineAdded: "added",
  diffLineRemoved: "removed",
  enterPassword: "Enter the password to view this book",
  wrongPassword: "Incorrect password",
  submitPassword: "Submit",

  // Copy link
  copyLink: "Copy link",
  copiedLink: "Copied",

  // About
  about: "About",
  aboutBody1: "tarie is a service that gives your quiet photos a home.",
  aboutBody2: "Arrange them into a photo book and share it with anyone via URL.",
  aboutBody3: "It's brand new, so there are no feed or reaction features yet.",
  aboutBody4: "We hope it becomes a small spark of communication between you and the people close to you.",

  // Settings
  settingsTitle: "Settings",
  settingsLanguage: "Language",
  // Language
  langJa: "日本語",
  langEn: "English",

  // Account
  deleteAccount: "Delete account",
  deleteAccountConfirm: "Are you sure you want to delete your account? All your data will be permanently deleted and cannot be recovered.",
  deleteAccountButton: "Delete account",

  // Image context menu
  replaceImage: "Replace",
  deleteImage: "Delete",
  addCoverImage: "Add cover image",
  replaceCoverImage: "Replace cover image",
  addPage: "Add page",
  deletePage: "Delete page",
  addPhoto: "Photo",
  addTextPage: "Text",
  maxWidth: "Max Photo Size",
  maxWidthUnit: "px",

  // Editor - photo item
  coverLabel: "Cover",
  caption: "Caption",
  save: "Save",
  textPlaceholder: "Enter text...",
  text: "Text",

  // Editor - settings
  showAuthorOnCover: "Show author on cover",
  layout: "Layout",
  layoutSingle: "Single",
  layoutDouble: "Double",
  writingDirection: "Text Direction",
  writingHorizontal: "Horizontal",
  writingVertical: "Vertical",
  showDate: "Show date",
  showLocation: "Show location",
  dateFormat: "Date format",
  dateFormatIso: "2024-03-15",
  dateFormatDots: "2024.03.15",
  dateFormatEn: "Mar 15, 2024",
  dateFormatJa: "2024年3月15日",
  dateFormatShort: "3/15",
  maxWidthNone: "None",
  maxWidthWide: "Wide",
  maxWidthNarrow: "Narrow",
  fontPreview: "Photo Memories",

  // Cover pattern labels
  coverPhotoSmallCenter: "Center Photo",
  coverNoPhotoCentered: "Text Center",
  coverImageOnly: "Image Only",
  coverSplitPhotoRight: "Split Right",
  coverFullphotoTl: "Full TL",
  coverFullphotoTc: "Full TC",
  coverFullphotoTr: "Full TR",
  coverFullphotoCl: "Full CL",
  coverFullphotoCc: "Full CC",
  coverFullphotoCr: "Full CR",
  coverFullphotoBl: "Full BL",
  coverFullphotoBc: "Full BC",
  coverFullphotoBr: "Full BR",

  // Diff labels
  diffTitleChanged: "Title changed",
  diffCoverPhotoAdded: "Cover image added",
  diffCoverPhotoRemoved: "Cover image removed",
  diffCoverPhotoChanged: "Cover image changed",
  diffPhotoAdded: "Photo added",
  diffPhotoRemoved: "Photo removed",
  diffPhotoReordered: "Photos reordered",
  diffCaptionChanged: "Caption changed",
  diffTextAdded: "Text page added",
  diffTextRemoved: "Text page removed",
  diffTextChanged: "Text page changed",
  diffConfigChanged: "{key} changed",
  diffConfigCoverPattern: "Cover pattern",
  diffConfigFontFamily: "Font",
  diffConfigCoverColor: "Background",
  diffConfigTransition: "Page transition",
  diffConfigAuthor: "Author",
  diffConfigShowAuthorOnCover: "Author on cover",
  diffConfigLayout: "Layout",
  diffConfigWritingMode: "Text direction",

  // Transition labels
  transitionNone: "None",
  transitionFade: "Fade",
  transitionSlide: "Slide",
  transitionZoom: "Zoom",
};
