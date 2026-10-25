import { ReactNode } from "react"
import { Badge, Container, Heading, Text } from "@medusajs/ui"

type PlaceholderPageProps = {
  title: string
  description: string
  prompt: string
  icon?: ReactNode
}

/**
 * Shared shell for operational admin routes that are intentionally deferred
 * to later prompts (Prompt 02 scope: routes may be shells so navigation
 * never 404s). Rendered with native @medusajs/ui tokens only.
 */
export function PlaceholderPage({
  title,
  description,
  prompt,
  icon,
}: PlaceholderPageProps) {
  return (
    <Container className="divide-y p-0">
      <div className="flex items-center gap-x-2 px-6 py-4">
        {icon}
        <Heading level="h2">{title}</Heading>
        <Badge size="2xsmall" color="grey" className="ml-auto">
          Bangladesh operations
        </Badge>
      </div>
      <div className="flex flex-col items-center gap-y-3 px-6 py-12">
        {icon ? (
          <div className="text-ui-fg-subtle [&_svg]:h-10 [&_svg]:w-10">{icon}</div>
        ) : null}
        <Text
          size="small"
          leading="compact"
          weight="plus"
          className="text-ui-fg-base"
        >
          {description}
        </Text>
        <Text size="small" leading="compact" className="text-ui-fg-subtle">
          Implemented in {prompt}. The route is live so sidebar navigation never
          returns a 404.
        </Text>
      </div>
    </Container>
  )
}
