// This script tests bcrypt password hashing and comparison
const bcrypt = require('bcrypt');

async function main() {
  try {
    // Test password
    const password = 'testpassword123';
    
    // Hash the password
    console.log('Hashing password...');
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log('Hashed password:', hashedPassword);
    
    // Test comparison with correct password
    console.log('\nTesting comparison with correct password...');
    const correctResult = await bcrypt.compare(password, hashedPassword);
    console.log('Correct password comparison result:', correctResult); // Should be true
    
    // Test comparison with incorrect password
    console.log('\nTesting comparison with incorrect password...');
    const incorrectResult = await bcrypt.compare('wrongpassword', hashedPassword);
    console.log('Incorrect password comparison result:', incorrectResult); // Should be false
    
  } catch (error) {
    console.error('Error testing bcrypt:', error);
  }
}

main(); 