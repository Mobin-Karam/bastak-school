# Registration Feature User Guide

## Overview

This guide provides step-by-step instructions for school administrators and staff on how to use the Registration Feature to enroll new students in the Bastak School platform.

## Getting Started

### Accessing the Registration System

1. Log in to the admin portal at `https://admin.bastak-school.com`
2. Navigate to **Students** → **Registration** in the main menu
3. Click on **New Registration** to start a new student registration

### Registration Dashboard Layout

The registration dashboard has three main areas:

- **Left Sidebar**: Navigation between the 15 registration sections
- **Main Content Area**: Current section form and instructions
- **Top Progress Bar**: Visual indicator of completion percentage

## Step-by-Step Registration Process

### Section 1: Basic Information

**Purpose**: Collect essential student identification information

**Fields to Complete**:
- National Code (10 digits)
- Birth Certificate Number (9 digits)
- First Name (Persian)
- Last Name (Persian)
- Date of Birth (Jalali calendar)
- Gender (Male/Female/Other)
- Education Level (Primary, Middle, High School)

**Tips**:
- Double-check national code format (10 digits only)
- Use Persian calendar for birth date
- All fields marked with * are required

### Section 2: Identity Information

**Purpose**: Verify student identity with official documents

**Fields to Complete**:
- ID Card Number
- Issue Place (City where ID was issued)
- Issue Date (Jalali calendar)
- Gender (confirm from ID)
- Photo (upload passport-style photo)

**Tips**:
- Ensure ID card is valid and not expired
- Photo should be clear, front-facing, and well-lit

### Section 3: Documents

**Purpose**: Upload required supporting documents

**Documents to Upload**:
- Birth Certificate (Shenasname)
- National ID Card
- Personal Photo
- School Transcript (optional)
- Recommendation Letter (optional)

**Upload Instructions**:
1. Select document type from dropdown
2. Click "Choose File" and select the document
3. Click "Upload" button
4. Wait for upload confirmation

**File Requirements**:
- Format: JPG, PNG, PDF
- Size: Maximum 10MB per file
- Resolution: Minimum 300 DPI for documents

### Section 4: Contact Information

**Purpose**: Collect contact details for communication

**Fields to Complete**:
- Mobile Number (Iranian format: 09xx-xxx-xxxx)
- Email Address
- Home Address (Persian)
- Postal Code (10 digits)
- City and Province

**Tips**:
- Verify mobile number can receive SMS
- Use professional email address
- Address should be complete with street name and building number

### Section 5: Family Information

**Purpose**: Collect family background information

**Fields to Complete**:
- Father's Full Name
- Mother's Full Name
- Father's National Code
- Mother's National Code
- Father's Occupation
- Mother's Occupation
- Number of Siblings
- Family Size

**Tips**:
- National codes must be 10 digits
- Occupation should be specific (e.g., "Teacher", "Engineer")

### Section 6: Educational Background

**Purpose**: Document previous academic history

**Fields to Complete**:
- Previous School Name
- Grade Level Completed
- GPA (0-20 scale)
- Academic Achievements
- Extracurricular Activities

**Tips**:
- GPA should be on the 0-20 Iranian scale
- List achievements chronologically

### Section 7: Health Information

**Purpose**: Collect health-related information for school records

**Fields to Complete**:
- Blood Type (A+, B-, O+, etc.)
- Height (cm)
- Weight (kg)
- Medical Conditions
- Allergies
- Emergency Contact 1 (Name, Relationship, Phone)
- Emergency Contact 2 (Name, Relationship, Phone)

**Tips**:
- Be honest about medical conditions and allergies
- Emergency contacts should be reachable 24/7

### Sections 8-15: Additional Information

These sections collect additional information that may be required by your specific school:

- **Extracurricular Activities**: Sports, arts, music, clubs
- **Academic Interests**: Favorite subjects, learning style, career goals
- **Transportation**: School bus needs, pickup/dropoff locations
- **Financial Information**: Tuition payment method, scholarships
- **Consent Agreements**: Privacy policy, terms of service, photo consent
- **Emergency Contacts**: Additional emergency contacts
- **Academic History**: Detailed history across multiple schools
- **Registration Completion**: Final review and submission

## Managing Registrations

### Viewing Existing Registrations

1. Go to **Students** → **Registrations**
2. Use filters to search by:
   - Student name
   - National code
   - Registration status
   - Date range
3. Click on any registration to view details

### Editing Registrations

1. Open the registration you want to edit
2. Click the **Edit** button in the top right corner
3. Make your changes
4. Click **Save Changes**

**Note**: Some fields may be locked after certain statuses (e.g., after approval)

### Approving Registrations

1. Go to **Students** → **Pending Registrations**
2. Review each registration carefully
3. Click **Approve** to accept or **Reject** to decline
4. Add comments for rejected registrations

### Generating Reports

1. Go to **Reports** → **Registration Reports**
2. Select report type:
   - Registration Statistics
   - Demographic Analysis
   - Completion Rates
   - Drop-off Analysis
3. Set date range and filters
4. Click **Generate Report**

## Troubleshooting Common Issues

### Issue: Registration Form Not Loading

**Possible Causes**:
- Internet connection issues
- Browser cache problems
- Server maintenance

**Solutions**:
- Refresh the page (F5)
- Clear browser cache and cookies
- Try a different browser
- Check system status page

### Issue: Document Upload Fails

**Possible Causes**:
- File too large
- Unsupported file format
- Network interruption

**Solutions**:
- Compress file to under 10MB
- Convert to JPG, PNG, or PDF format
- Check internet connection
- Try uploading smaller files first

### Issue: Validation Errors

**Common Validation Messages**:
- "Invalid national code format" - Must be exactly 10 digits
- "Invalid mobile number" - Must start with 09 and be 11 digits
- "Email format invalid" - Must contain @ and domain
- "Date format invalid" - Use Jalali calendar format

## Best Practices

### For Administrators

- **Regular Backups**: Schedule daily backups of registration data
- **Data Privacy**: Never share sensitive student information publicly
- **Training**: Provide training for new staff on registration procedures
- **Monitoring**: Track registration completion rates and drop-off points

### For Data Entry Staff

- **Double-Check**: Always verify national codes and dates
- **Consistent Formatting**: Use Persian characters consistently
- **Complete Records**: Fill all required fields before submission
- **Document Management**: Keep physical copies of uploaded documents

### For IT Support

- **System Monitoring**: Monitor API response times and error rates
- **Storage Management**: Monitor document storage usage
- **Security Audits**: Regularly audit access logs and permissions
- **Performance Optimization**: Optimize database queries for registration tables

## Support Resources

### Help Documentation
- [Online Help Center](https://help.bastak-school.com/registration)
- [Video Tutorials](https://help.bastak-school.com/registration/videos)
- [FAQ](https://help.bastak-school.com/registration/faq)

### Contact Support
- **Email**: support@bastak-school.com
- **Phone**: +98 21 1234 5678 (Tehran office)
- **Live Chat**: Available in admin portal during business hours

### Business Hours
- Sunday-Thursday: 8:00 AM - 6:00 PM (Iran Time)
- Friday-Saturday: Closed

## License

MIT License