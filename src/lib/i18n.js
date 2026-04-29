/**
 * i18n translations for RemitChain
 */
export const translations = {
  en: {
    // Common
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',
    cancel: 'Cancel',
    confirm: 'Confirm',
    save: 'Save',
    delete: 'Delete',
    edit: 'Edit',
    back: 'Back',
    next: 'Next',
    
    // Auth
    signIn: 'Sign In',
    signOut: 'Sign Out',
    email: 'Email',
    enterEmail: 'Enter your email',
    
    // Remittance
    send: 'Send',
    receive: 'Receive',
    amount: 'Amount',
    fee: 'Fee',
    total: 'Total',
    quote: 'Get Quote',
    approve: 'Approve',
    remit: 'Send Money',
    
    // Receipt
    receipt: 'Receipt',
    receiptId: 'Receipt ID',
    transactionHash: 'Transaction Hash',
    sender: 'Sender',
    receiver: 'Receiver',
    exchangeRate: 'Exchange Rate',
    
    // Contacts
    contacts: 'Contacts',
    addContact: 'Add Contact',
    contactName: 'Contact Name',
    
    // Cash-out
    cashOut: 'Cash Out',
    upi: 'UPI',
    bank: 'Bank Transfer',
    status: 'Status'
  },
  hi: {
    // Common
    loading: 'लोड हो रहा है...',
    error: 'त्रुटि',
    success: 'सफल',
    cancel: 'रद्द करें',
    confirm: 'पुष्टि करें',
    save: 'सहेजें',
    delete: 'हटाएं',
    edit: 'संपादित करें',
    back: 'पीछे',
    next: 'आगे',
    
    // Auth
    signIn: 'साइन इन करें',
    signOut: 'साइन आउट करें',
    email: 'ईमेल',
    enterEmail: 'अपना ईमेल डालें',
    
    // Remittance
    send: 'भेजें',
    receive: 'प्राप्त करें',
    amount: 'राशि',
    fee: 'शुल्क',
    total: 'कुल',
    quote: 'कोटेशन प्राप्त करें',
    approve: 'स्वीकृत करें',
    remit: 'पैसे भेजें',
    
    // Receipt
    receipt: 'रसीद',
    receiptId: 'रसीद आईडी',
    transactionHash: 'लेन-देन हैश',
    sender: 'भेजने वाला',
    receiver: 'प्राप्तकर्ता',
    exchangeRate: 'विनिमय दर',
    
    // Contacts
    contacts: 'संपर्क',
    addContact: 'संपर्क जोड़ें',
    contactName: 'संपर्क नाम',
    
    // Cash-out
    cashOut: 'पैसे निकालें',
    upi: 'UPI',
    bank: 'बैंक हस्तांतरण',
    status: 'स्थिति'
  }
};

export function useTranslation(locale = 'en') {
  return (key) => {
    const keys = key.split('.');
    let value = translations[locale] || translations.en;
    for (const k of keys) {
      value = value?.[k];
      if (!value) break;
    }
    return value || key;
  };
}