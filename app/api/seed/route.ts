import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function GET() {
  try {
    console.log('Seeding database...');
    
    // Create admin user
    const adminPassword = await bcrypt.hash('admin123', 10);
    const admin = await prisma.user.upsert({
      where: { email: 'admin@allotwise.com' },
      update: {},
      create: {
        name: 'Admin User',
        email: 'admin@allotwise.com',
        password: adminPassword,
        role: 'ADMIN',
      },
    });
    
    // Create partner user
    const partnerPassword = await bcrypt.hash('partner123', 10);
    const partner = await prisma.user.upsert({
      where: { email: 'partner@allotwise.com' },
      update: {},
      create: {
        name: 'Partner User',
        email: 'partner@allotwise.com',
        password: partnerPassword,
        role: 'PARTNER',
      },
    });
    
    // Create sample members
    await prisma.member.upsert({
      where: { panNumber: 'ABCDE1234F' },
      update: {},
      create: {
        fullName: 'Rajesh Patel',
        panNumber: 'ABCDE1234F',
        mobile: '9876543210',
        notes: 'Primary applicant',
      },
    });
    
    await prisma.member.upsert({
      where: { panNumber: 'FGHIJ5678K' },
      update: {},
      create: {
        fullName: 'Priya Shah',
        panNumber: 'FGHIJ5678K',
        mobile: '9876543211',
        notes: 'Family member',
      },
    });
    
    console.log('✅ Database seeded successfully!');
    return NextResponse.json({ 
      message: 'Database seeded!',
      users: [admin.email, partner.email] 
    });
  } catch (error) {
    console.error('Error seeding:', error);
    return NextResponse.json({ error: 'Failed to seed database' }, { status: 500 });
  }
}