/**
 * Input validation utilities for RuralMed API
 * Ensures data integrity at the backend layer
 */

export const validators = {
  /**
   * Validate patient age (0-150 years)
   */
  age: (age) => {
    const ageNum = parseInt(age, 10);
    if (isNaN(ageNum) || ageNum < 0 || ageNum > 150) {
      return { valid: false, message: 'Age must be between 0 and 150' };
    }
    return { valid: true };
  },

  /**
   * Validate phone number (basic format)
   */
  phone: (phone) => {
    // Allow '—' em-dash as a sentinel meaning "no phone provided"
    if (phone === '—') return { valid: true };
    if (!phone || phone.length < 7 || phone.length > 15) {
      return { valid: false, message: 'Phone number must be 7-15 characters' };
    }
    // Allow digits, +, -, spaces, and parentheses
    if (!/^[\d+\-\s()]+$/.test(phone)) {
      return { valid: false, message: 'Phone number contains invalid characters' };
    }
    return { valid: true };
  },

  /**
   * Validate email format
   */
  email: (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { valid: false, message: 'Invalid email format' };
    }
    return { valid: true };
  },

  /**
   * Validate rating (1-5)
   */
  rating: (rating) => {
    if (rating === null || rating === undefined) {
      return { valid: true }; // Rating is optional
    }
    const ratingNum = parseInt(rating, 10);
    if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      return { valid: false, message: 'Rating must be between 1 and 5' };
    }
    return { valid: true };
  },

  /**
   * Validate stock quantity (>= 0)
   */
  stock: (stock) => {
    const stockNum = parseInt(stock, 10);
    if (isNaN(stockNum) || stockNum < 0) {
      return { valid: false, message: 'Stock must be a non-negative number' };
    }
    return { valid: true };
  },

  /**
   * Validate gender field
   */
  gender: (gender) => {
    const validGenders = ['Male', 'Female', 'Other'];
    if (!validGenders.includes(gender)) {
      return { valid: false, message: 'Gender must be Male, Female, or Other' };
    }
    return { valid: true };
  },

  /**
   * Validate patient status
   */
  patientStatus: (status) => {
    const validStatuses = ['Active', 'Inactive', 'Referred', 'Lost to Follow-up'];
    if (!validStatuses.includes(status)) {
      return { valid: false, message: 'Invalid patient status' };
    }
    return { valid: true };
  },

  /**
   * Validate referral status
   */
  referralStatus: (status) => {
    const validStatuses = ['Pending', 'Sent', 'Acknowledged', 'Arrived', 'Rejected'];
    if (!validStatuses.includes(status)) {
      return { valid: false, message: 'Invalid referral status' };
    }
    return { valid: true };
  },

  /**
   * Validate dosage format (basic)
   */
  dosage: (dosage) => {
    if (!dosage || dosage.trim().length === 0) {
      return { valid: false, message: 'Dosage cannot be empty' };
    }
    if (dosage.length > 100) {
      return { valid: false, message: 'Dosage is too long' };
    }
    return { valid: true };
  },

  /**
   * Validate duration format
   */
  duration: (duration) => {
    if (!duration || duration.trim().length === 0) {
      return { valid: false, message: 'Duration cannot be empty' };
    }
    if (duration.length > 50) {
      return { valid: false, message: 'Duration is too long' };
    }
    return { valid: true };
  },

  /**
   * Validate drug name
   */
  drugName: (name) => {
    if (!name || name.trim().length === 0) {
      return { valid: false, message: 'Drug name cannot be empty' };
    }
    if (name.length > 100) {
      return { valid: false, message: 'Drug name is too long' };
    }
    return { valid: true };
  },

  /**
   * Validate required string field
   */
  requiredString: (value, fieldName, maxLength = 255) => {
    if (!value || value.trim().length === 0) {
      return { valid: false, message: `${fieldName} is required` };
    }
    if (value.length > maxLength) {
      return { valid: false, message: `${fieldName} is too long (max ${maxLength} characters)` };
    }
    return { valid: true };
  },
};

/**
 * Validate patient input
 */
export function validatePatient(patient) {
  const errors = [];

  // Validate name
  const nameValidation = validators.requiredString(patient.name, 'Name', 100);
  if (!nameValidation.valid) errors.push(nameValidation.message);

  // Validate age
  if (patient.age !== undefined && patient.age !== null) {
    const ageValidation = validators.age(patient.age);
    if (!ageValidation.valid) errors.push(ageValidation.message);
  }

  // Validate gender
  if (patient.gender) {
    const genderValidation = validators.gender(patient.gender);
    if (!genderValidation.valid) errors.push(genderValidation.message);
  }

  // Validate village
  const villageValidation = validators.requiredString(patient.village, 'Village', 100);
  if (!villageValidation.valid) errors.push(villageValidation.message);

  // Validate phone
  if (patient.phone) {
    const phoneValidation = validators.phone(patient.phone);
    if (!phoneValidation.valid) errors.push(phoneValidation.message);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate prescription input
 */
export function validatePrescription(prescription) {
  const errors = [];

  // Only drug name is strictly required
  const drugValidation = validators.drugName(prescription.drug);
  if (!drugValidation.valid) errors.push(drugValidation.message);

  // Dosage is optional — validate only if provided
  if (prescription.dosage && prescription.dosage.trim()) {
    const dosageValidation = validators.dosage(prescription.dosage);
    if (!dosageValidation.valid) errors.push(dosageValidation.message);
  }

  // Duration is optional — validate only if provided
  if (prescription.duration && prescription.duration.trim()) {
    const durationValidation = validators.duration(prescription.duration);
    if (!durationValidation.valid) errors.push(durationValidation.message);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate referral input
 */
export function validateReferral(referral) {
  const errors = [];

  // Validate facility
  const facilityValidation = validators.requiredString(referral.facility, 'Facility', 100);
  if (!facilityValidation.valid) errors.push(facilityValidation.message);

  // Validate reason
  const reasonValidation = validators.requiredString(referral.reason, 'Reason', 500);
  if (!reasonValidation.valid) errors.push(reasonValidation.message);

  // Validate urgency if provided
  if (referral.urgency) {
    const validUrgencies = ['Routine', 'Urgent', 'Emergency'];
    if (!validUrgencies.includes(referral.urgency)) {
      errors.push('Invalid urgency level');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate feedback input
 */
export function validateFeedback(feedback) {
  const errors = [];

  // Validate type
  const typeValidation = validators.requiredString(feedback.type, 'Type', 50);
  if (!typeValidation.valid) errors.push(typeValidation.message);

  // Validate message
  const messageValidation = validators.requiredString(feedback.message, 'Message', 1000);
  if (!messageValidation.valid) errors.push(messageValidation.message);

  // Validate rating if provided
  if (feedback.rating !== undefined && feedback.rating !== null) {
    const ratingValidation = validators.rating(feedback.rating);
    if (!ratingValidation.valid) errors.push(ratingValidation.message);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate inventory input
 */
export function validateInventory(item) {
  const errors = [];

  // Validate name
  const nameValidation = validators.requiredString(item.name, 'Name', 100);
  if (!nameValidation.valid) errors.push(nameValidation.message);

  // Validate stock
  if (item.stock !== undefined && item.stock !== null) {
    const stockValidation = validators.stock(item.stock);
    if (!stockValidation.valid) errors.push(stockValidation.message);
  }

  // Validate minThreshold
  if (item.minThreshold !== undefined && item.minThreshold !== null) {
    const minValidation = validators.stock(item.minThreshold);
    if (!minValidation.valid) errors.push('Min threshold must be a non-negative number');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
