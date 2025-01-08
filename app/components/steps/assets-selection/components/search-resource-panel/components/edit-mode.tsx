import { useSearchStore } from '@/app/stores/use-search-store'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { SearchResult } from '@/lib/api/search'
import { useCallback } from 'react'
import { EditModeProps } from '../types'
import { ExternalLink } from 'lucide-react'
import { motion } from 'framer-motion'

const containerVariants = {
  hidden: { opacity: 0, scale: 0.98 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.25,
      ease: "easeOut",
      when: "beforeChildren",
      staggerChildren: 0.08
    }
  }
}

const sectionVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 25
    }
  }
}

export function EditMode({ editingResource, onResourceSelect, t }: EditModeProps) {
  const { updateField, searchResults } = useSearchStore()

  const handleContentChange = useCallback((newContent: string) => {
    if (editingResource?.url && onResourceSelect) {
      onResourceSelect([editingResource.url], newContent)
      const updatedResults = searchResults.map((r: SearchResult) =>
        r.url === editingResource.url
          ? { ...r, snippet: newContent.substring(0, 200) + '...', content: newContent }
          : r
      )
      updateField('searchResults', updatedResults)
    }
  }, [editingResource, onResourceSelect, searchResults, updateField])

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="flex flex-1 flex-col max-w-5xl mx-auto w-full h-full overflow-auto @container"
    >
      <div className="flex flex-col flex-1 grid-cols-1 @[800px]:grid-cols-[280px_1fr] gap-4 @[800px]:gap-6 bg-card rounded-lg p-3 @[800px]:p-4 shadow-sm border relative">
        <div className="grid grid-cols-1 @[800px]:grid-cols-[280px_1fr] gap-4 @[800px]:gap-6 flex-1">
          {/* Left panel: Meta information */}
          <motion.div variants={sectionVariants} className="flex flex-col space-y-4">
            {/* Title and source */}
            <div className="space-y-3">
              <span className="inline-flex px-3 py-1.5 bg-primary/10 text-primary rounded-full text-xs font-semibold tracking-wide">
                {t('home:step.asset-type.provider_' + editingResource.meta?.provider.toLowerCase())}
              </span>
              <h3 className="text-base font-semibold text-foreground/90 leading-relaxed">
                {editingResource.title}
              </h3>
              <a
                href={editingResource.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors group max-w-full"
              >
                <ExternalLink className="h-4 w-4 shrink-0 group-hover:stroke-primary" />
                <span className="truncate underline-offset-4 hover:underline">{editingResource.url}</span>
              </a>
            </div>

            {/* Search info */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-muted-foreground">
                {t('home:step.asset-type.search_description')}
              </Label>
              <p className="text-sm text-foreground/80 leading-relaxed">
                {editingResource.meta?.searchDescription}
              </p>
            </div>

            {/* Keywords */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-muted-foreground">
                {t('home:step.asset-type.search_keywords')}
              </Label>
              <div className="flex flex-wrap gap-2">
                {editingResource.meta?.keywords.map((keyword, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-secondary text-secondary-foreground rounded-full text-xs font-medium"
                  >
                    {keyword}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Right panel: Content editor */}
          <motion.div variants={sectionVariants} className="flex flex-col flex-1 space-y-4">
            <Label className="text-sm font-medium text-foreground">
              {t('home:step.asset-type.edit_content')}
            </Label>
            <div className="flex-1">
              <Textarea
                value={editingResource.content}
                onChange={(e) => handleContentChange(e.target.value)}
                className="block w-full h-[500px] resize-none font-mono text-sm leading-relaxed bg-background focus-visible:ring-1 focus-visible:ring-primary focus-visible:ring-offset-1 focus-visible:ring-offset-background transition-all"
                placeholder={t('home:step.asset-type.edit_content_placeholder')}
              />
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  )
}
