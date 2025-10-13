import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-change-in-production'
);

async function verifyAuth(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth-token');

  if (!token) {
    return null;
  }

  try {
    const { payload } = await jwtVerify(token.value, JWT_SECRET);
    return payload;
  } catch (error) {
    return null;
  }
}

// GET - Fetch all email templates
export async function GET(request: Request) {
  try {
    const user = await verifyAuth(request);

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Fetch templates from database
    const templates = await prisma.emailTemplate.findMany({
      include: {
        _count: {
          select: {
            emailLogs: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Get the latest sent email for each template
    const templatesWithStats = await Promise.all(
      templates.map(async (template) => {
        const latestLog = await prisma.emailLog.findFirst({
          where: {
            templateId: template.id,
            status: 'SENT',
          },
          orderBy: {
            sentAt: 'desc',
          },
        });

        return {
          ...template,
          sentCount: template._count.emailLogs,
          lastSent: latestLog?.sentAt,
        };
      })
    );

    return NextResponse.json({
      templates: templatesWithStats,
    });
  } catch (error) {
    console.error('Error fetching email templates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch email templates' },
      { status: 500 }
    );
  }
}

// POST - Create or update email template
export async function POST(request: Request) {
  try {
    const user = await verifyAuth(request);

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { id, type, name, subject, body: emailBody, variables } = body;

    if (!type || !name || !subject || !emailBody) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    let template;

    if (id) {
      // Check if template exists
      const existingTemplate = await prisma.emailTemplate.findUnique({
        where: { id },
      });

      if (existingTemplate) {
        // Update existing template
        template = await prisma.emailTemplate.update({
          where: { id },
          data: {
            subject,
            body: emailBody,
            variables: variables || [],
            updatedAt: new Date(),
          },
        });
      } else {
        // Template not found, create new one instead
        template = await prisma.emailTemplate.create({
          data: {
            type,
            name,
            subject,
            body: emailBody,
            variables: variables || [],
            isActive: true,
          },
        });
      }
    } else {
      // Create new template
      template = await prisma.emailTemplate.create({
        data: {
          type,
          name,
          subject,
          body: emailBody,
          variables: variables || [],
          isActive: true,
        },
      });
    }

    return NextResponse.json({
      success: true,
      template,
    });
  } catch (error) {
    console.error('Error saving email template:', error);
    return NextResponse.json(
      { error: 'Failed to save email template' },
      { status: 500 }
    );
  }
}

// PUT - Toggle template active status
export async function PUT(request: Request) {
  try {
    const user = await verifyAuth(request);

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { id, isActive } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Template ID is required' },
        { status: 400 }
      );
    }

    const template = await prisma.emailTemplate.update({
      where: { id },
      data: {
        isActive,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      template,
    });
  } catch (error) {
    console.error('Error updating template status:', error);
    return NextResponse.json(
      { error: 'Failed to update template status' },
      { status: 500 }
    );
  }
}

// DELETE - Delete template
export async function DELETE(request: Request) {
  try {
    const user = await verifyAuth(request);

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Template ID is required' },
        { status: 400 }
      );
    }

    await prisma.emailTemplate.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Template deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting template:', error);
    return NextResponse.json(
      { error: 'Failed to delete template' },
      { status: 500 }
    );
  }
}
