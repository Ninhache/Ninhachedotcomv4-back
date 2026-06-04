import { Injectable, NotFoundException } from '@nestjs/common';
import { Locale, Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { ContactResponseDto } from './dto/contacts-response.dto';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';

@Injectable()
export class ContactService {
    constructor(private readonly prisma: PrismaService) {}

    private toDTO(
        contact: Prisma.ContactGetPayload<{ include: { translations: true } }>
    ): ContactResponseDto {
        const nameByLocale = contact.translations.reduce(
            (acc, t) => {
                acc[t.locale as Locale] = t.name;
                return acc;
            },
            {} as Record<Locale, string>
        );

        return {
            id: contact.id,
            contactUrl: contact.contactUrl,
            imageUrl: contact.imageUrl,
            isVisible: contact.isVisible,
            cssSize: contact.cssSize,
            translations: contact.translations.map(t => ({
                id: t.id,
                locale: t.locale,
                name: t.name,
                contactId: t.contactId,
            })),
            nameByLocale,
        };
    }

    async create(dto: CreateContactDto) {
        const allLocales = Object.values(Locale);
        const provided = new Map(dto.translations.map(t => [t.locale, t.name]));
        const fallbackName = dto.translations[0]?.name ?? 'Unnamed';

        const finalTranslations = allLocales.map(loc => ({
            locale: loc,
            name: provided.get(loc) ?? fallbackName,
        }));

        const created = await this.prisma.contact.create({
            data: {
                contactUrl: dto.contactUrl,
                imageUrl: dto.imageUrl,
                isVisible: dto.isVisible,
                cssSize: dto.cssSize ?? null,
                translations: { create: finalTranslations },
            },
            include: {
                translations: true,
            },
        });

        return this.toDTO(created);
    }

    async findAll() {
        const contacts = await this.prisma.contact.findMany({
            include: {
                translations: true,
            },
        });

        return contacts.map(c => this.toDTO(c));
    }

    async findOne(id: string) {
        const contact = await this.prisma.contact.findUnique({
            where: { id },
            include: { translations: true },
        });

        if (!contact) {
            throw new NotFoundException(`Contact with [${id}] not found`);
        }

        return this.toDTO(contact);
    }

    async update(id: string, updateContactDto: UpdateContactDto) {
        await this.findOne(id);

        const { contactUrl, imageUrl, isVisible, cssSize, translations } =
            updateContactDto;

        const updated = await this.prisma.contact.update({
            where: { id },
            data: {
                contactUrl,
                imageUrl,
                isVisible,
                cssSize,
                translations: translations
                    ? {
                          deleteMany: {},
                          create: translations.map(t => ({
                              locale: t.locale,
                              name: t.name,
                          })),
                      }
                    : undefined,
            },
            include: {
                translations: true,
            },
        });

        return this.toDTO(updated);
    }

    async remove(id: string) {
        await this.findOne(id);

        await this.prisma.contact.delete({
            where: { id },
        });
    }
}
