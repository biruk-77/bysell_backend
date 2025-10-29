# 🚨 **Frontend Error Handling Guide**
## **How to Display Backend Error Messages**

---

## 📋 **Backend Error Response Format**

All error responses now follow this consistent format:

```json
{
  "success": false,
  "message": "Main error message",
  "errors": [
    "Specific error 1",
    "Specific error 2"
  ]
}
```

---

## 🎯 **Frontend Implementation Examples**

### **React Example (Registration Form)**

```jsx
import React, { useState } from 'react';

const RegisterForm = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    role: 'employee'
  });
  
  const [errors, setErrors] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors([]); // Clear previous errors

    try {
      const response = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (data.success) {
        // Registration successful
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        // Redirect to dashboard
        window.location.href = '/dashboard';
      } else {
        // Show errors from backend
        setErrors(data.errors || [data.message]);
      }
    } catch (error) {
      setErrors(['Network error. Please check your connection.']);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Error Display */}
      {errors.length > 0 && (
        <div className="error-container">
          <h4>Please fix the following errors:</h4>
          <ul>
            {errors.map((error, index) => (
              <li key={index} className="error-message">
                {error}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Form Fields */}
      <input
        type="text"
        placeholder="Username"
        value={formData.username}
        onChange={(e) => setFormData({...formData, username: e.target.value})}
      />
      
      <input
        type="email"
        placeholder="Email"
        value={formData.email}
        onChange={(e) => setFormData({...formData, email: e.target.value})}
      />
      
      <input
        type="password"
        placeholder="Password"
        value={formData.password}
        onChange={(e) => setFormData({...formData, password: e.target.value})}
      />
      
      <select
        value={formData.role}
        onChange={(e) => setFormData({...formData, role: e.target.value})}
      >
        <option value="employee">Employee</option>
        <option value="employer">Employer</option>
        <option value="buyer">Buyer</option>
        <option value="seller">Seller</option>
        <option value="connector">Connector</option>
      </select>

      <button type="submit" disabled={isLoading}>
        {isLoading ? 'Creating Account...' : 'Register'}
      </button>
    </form>
  );
};
```

### **CSS for Error Styling**

```css
.error-container {
  background-color: #fee;
  border: 1px solid #fcc;
  border-radius: 4px;
  padding: 12px;
  margin-bottom: 16px;
}

.error-container h4 {
  color: #c33;
  margin: 0 0 8px 0;
  font-size: 14px;
}

.error-container ul {
  margin: 0;
  padding-left: 20px;
}

.error-message {
  color: #c33;
  font-size: 13px;
  margin-bottom: 4px;
}

/* Success styling */
.success-container {
  background-color: #efe;
  border: 1px solid #cfc;
  border-radius: 4px;
  padding: 12px;
  margin-bottom: 16px;
  color: #3c3;
}
```

### **Vanilla JavaScript Example**

```javascript
// Registration function
async function registerUser(formData) {
  const errorContainer = document.getElementById('error-container');
  const submitButton = document.getElementById('submit-btn');
  
  // Clear previous errors
  errorContainer.innerHTML = '';
  errorContainer.style.display = 'none';
  
  // Show loading state
  submitButton.disabled = true;
  submitButton.textContent = 'Creating Account...';

  try {
    const response = await fetch('http://localhost:5000/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData)
    });

    const data = await response.json();

    if (data.success) {
      // Success - redirect or show success message
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      window.location.href = '/dashboard';
    } else {
      // Show errors
      displayErrors(data.errors || [data.message]);
    }
  } catch (error) {
    displayErrors(['Network error. Please check your connection.']);
  } finally {
    // Reset button
    submitButton.disabled = false;
    submitButton.textContent = 'Register';
  }
}

// Function to display errors
function displayErrors(errors) {
  const errorContainer = document.getElementById('error-container');
  
  if (errors.length > 0) {
    let errorHTML = '<h4>Please fix the following errors:</h4><ul>';
    errors.forEach(error => {
      errorHTML += `<li>${error}</li>`;
    });
    errorHTML += '</ul>';
    
    errorContainer.innerHTML = errorHTML;
    errorContainer.style.display = 'block';
  }
}
```

### **HTML Structure**

```html
<form id="register-form">
  <!-- Error Container -->
  <div id="error-container" class="error-container" style="display: none;"></div>
  
  <!-- Form Fields -->
  <input type="text" id="username" placeholder="Username" required>
  <input type="email" id="email" placeholder="Email" required>
  <input type="password" id="password" placeholder="Password" required>
  
  <select id="role">
    <option value="employee">Employee</option>
    <option value="employer">Employer</option>
    <option value="buyer">Buyer</option>
    <option value="seller">Seller</option>
    <option value="connector">Connector</option>
  </select>
  
  <button type="submit" id="submit-btn">Register</button>
</form>
```

---

## 🎯 **Error Types You'll Receive**

### **Validation Errors (400)**
```json
{
  "success": false,
  "message": "Please fix the following errors:",
  "errors": [
    "Username is required",
    "Email is required",
    "Password must be at least 6 characters long"
  ]
}
```

### **Duplicate User (400)**
```json
{
  "success": false,
  "message": "This email is already taken",
  "errors": [
    "A user with this email already exists"
  ]
}
```

### **Server Error (500)**
```json
{
  "success": false,
  "message": "Registration failed. Please try again.",
  "errors": [
    "Server error occurred during registration"
  ]
}
```

---

## 🚀 **Quick Implementation Tips**

1. **Always check `data.success`** first
2. **Display `data.errors` array** for specific messages
3. **Use `data.message`** as the main error title
4. **Clear errors** before new requests
5. **Show loading states** during requests
6. **Handle network errors** with try/catch

**Your backend now sends consistent, user-friendly error messages that are perfect for frontend display!** 🎉
