import { withSystemLocale } from '@/i18n/runtime.server';

import { t as __tr } from "@/i18n";
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';


async function verifyAuth(request: Request) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) return null;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.role !== 'ADMIN') return null;
    return user;
  } catch (_e) {
    return null;
  }
}

// GET - Fetch all email templates
 async function GETHandler(request: Request) {
  try {
    const user = await verifyAuth(request);

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: __tr("Unauthorized") },
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
      { error: __tr("Failed to fetch email templates") },
      { status: 500 }
    );
  }
}

// POST - Create or update email template
 async function POSTHandler(request: Request) {
  try {
    const user = await verifyAuth(request);

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: __tr("Unauthorized") },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { id, type, name, subject, body: emailBody, variables } = body;

    if (!type || !name || !subject || !emailBody) {
      return NextResponse.json(
        { error: __tr("Missing required fields") },
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
      { error: __tr("Failed to save email template") },
      { status: 500 }
    );
  }
}

// PUT - Toggle template active status
 async function PUTHandler(request: Request) {
  try {
    const user = await verifyAuth(request);

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: __tr("Unauthorized") },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { id, isActive } = body;

    if (!id) {
      return NextResponse.json(
        { error: __tr("Template ID is required") },
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
      { error: __tr("Failed to update template status") },
      { status: 500 }
    );
  }
}

// DELETE - Delete template
 async function DELETEHandler(request: Request) {
  try {
    const user = await verifyAuth(request);

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: __tr("Unauthorized") },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: __tr("Template ID is required") },
        { status: 400 }
      );
    }

    await prisma.emailTemplate.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: __tr("Template deleted successfully"),
    });
  } catch (error) {
    console.error('Error deleting template:', error);
    return NextResponse.json(
      { error: __tr("Failed to delete template") },
      { status: 500 }
    );
  }
}

export const GET = withSystemLocale(GETHandler);
export const POST = withSystemLocale(POSTHandler);
export const PUT = withSystemLocale(PUTHandler);
export const DELETE = withSystemLocale(DELETEHandler);
