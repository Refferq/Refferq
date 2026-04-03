'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Download,
  FileText,
  Image,
  Video,
  Search,
  ExternalLink,
  Layers,
  FolderOpen,
} from 'lucide-react';

interface Resource {
  id: string;
  title: string;
  description?: string;
  type: string;
  fileUrl: string;
  fileName: string;
  fileSize?: number;
  category?: string;
  downloads: number;
  createdAt: string;
}

const typeIcons: Record<string, React.ElementType> = {
  BANNER: Image,
  LOGO: Image,
  SOCIAL_POST: Image,
  EMAIL_TEMPLATE: FileText,
  DOCUMENT: FileText,
  VIDEO: Video,
  OTHER: Layers,
};

const typeColors: Record<string, string> = {
  BANNER: 'bg-blue-100 text-blue-700',
  LOGO: 'bg-purple-100 text-purple-700',
  SOCIAL_POST: 'bg-pink-100 text-pink-700',
  EMAIL_TEMPLATE: 'bg-amber-100 text-amber-700',
  DOCUMENT: 'bg-slate-100 text-slate-700',
  VIDEO: 'bg-red-100 text-red-700',
  OTHER: 'bg-gray-100 text-gray-700',
};

const typeLabels: Record<string, string> = {
  BANNER: 'Баннер',
  LOGO: 'Логотип',
  SOCIAL_POST: 'Пост для соцсетей',
  EMAIL_TEMPLATE: 'Email-шаблон',
  DOCUMENT: 'Документ',
  VIDEO: 'Видео',
  OTHER: 'Другое',
};

export default function ResourcesPage() {
  const { loading: authLoading } = useAuth();
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  useEffect(() => {
    if (!authLoading) fetchResources();
  }, [authLoading]);

  const fetchResources = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/affiliate/resources');
      const data = await res.json();
      if (data.success) setResources(data.resources || []);
    } catch (error) {
      console.error('Failed to fetch resources:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (resource: Resource) => {
    // Track download
    try {
      await fetch(`/api/affiliate/resources?id=${resource.id}`, { method: 'POST' });
    } catch (_e) { /* ignore tracking errors */ }

    // Open/download file
    window.open(resource.fileUrl, '_blank');
    setResources((prev) =>
      prev.map((r) => (r.id === resource.id ? { ...r, downloads: r.downloads + 1 } : r))
    );
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  const categories: string[] = ['ALL', ...Array.from(new Set(resources.map((r) => r.category).filter((c): c is string => Boolean(c))))];

  const filteredResources = resources.filter((r) => {
    const matchesSearch =
      !searchQuery ||
      r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.description || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'ALL' || r.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  if (authLoading || loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => <Skeleton key={i} className="h-48" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Материалы</h1>
        <p className="text-muted-foreground">
          Скачивайте маркетинговые материалы, баннеры и промо-ассеты
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
              <Layers className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{resources.length}</p>
              <p className="text-xs text-muted-foreground">Всего материалов</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
              <Image className="h-4 w-4 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{resources.filter((r) => ['BANNER', 'LOGO', 'SOCIAL_POST'].includes(r.type)).length}</p>
              <p className="text-xs text-muted-foreground">Визуальные материалы</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
              <Download className="h-4 w-4 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{resources.reduce((sum, r) => sum + r.downloads, 0)}</p>
              <p className="text-xs text-muted-foreground">Всего скачиваний</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Поиск материалов..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {categories.map((cat) => (
            <Button
              key={cat}
              variant={categoryFilter === cat ? 'default' : 'outline'}
              size="sm"
              onClick={() => setCategoryFilter(cat)}
            >
              {cat === 'ALL' ? 'Все' : cat}
            </Button>
          ))}
        </div>
      </div>

      {/* Resources Grid */}
      {filteredResources.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <FolderOpen className="h-12 w-12 text-muted-foreground/40 mb-3" />
            <p className="font-medium">Материалы не найдены</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {resources.length === 0
                ? 'Материалы появятся здесь после загрузки администратором'
                : 'Попробуйте изменить поиск или фильтр'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredResources.map((resource) => {
            const Icon = typeIcons[resource.type] || Layers;
            const colorClass = typeColors[resource.type] || 'bg-gray-100 text-gray-700';
            return (
              <Card key={resource.id} className="group hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${colorClass}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {typeLabels[resource.type] || resource.type.replace('_', ' ')}
                    </Badge>
                  </div>
                  <CardTitle className="text-base mt-3">{resource.title}</CardTitle>
                  {resource.description && (
                    <CardDescription className="line-clamp-2">{resource.description}</CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
                    <span>{resource.fileName}</span>
                    <span>{formatFileSize(resource.fileSize)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      {resource.downloads} скачиваний
                    </span>
                    <div className="flex gap-1.5">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(resource.fileUrl, '_blank')}
                      >
                        <ExternalLink className="h-3.5 w-3.5 mr-1" />
                        Просмотр
                      </Button>
                      <Button size="sm" onClick={() => handleDownload(resource)}>
                        <Download className="h-3.5 w-3.5 mr-1" />
                        Скачать
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
