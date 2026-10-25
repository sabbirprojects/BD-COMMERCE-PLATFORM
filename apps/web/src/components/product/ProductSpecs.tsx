import { Shield, MapPin, Sparkles, RefreshCw, AlertTriangle } from 'lucide-react'
import { Locale, getDictionary } from '@/lib/i18n'
import { ProductLocalizationData } from '@/lib/medusa'

interface ProductSpecsProps {
  localization?: ProductLocalizationData | null
  locale: Locale
}

export function ProductSpecs({ localization, locale }: ProductSpecsProps) {
  const dict = getDictionary(locale)
  if (!localization) return null

  const profile = localization.profile
  const brand = localization.brand
  const loc = localization.localization
  const attributes = localization.attributes || []

  const originNote = locale === 'bn' ? profile?.origin_note_bn : profile?.origin_note_en
  const warrantyNote = locale === 'bn' ? profile?.warranty_note_bn : profile?.warranty_note_en
  const careInstructions = locale === 'bn' ? loc?.care_instructions_bn : null

  return (
    <div className="space-y-8 divide-y divide-slate-200 dark:divide-slate-800">
      {/* Bangladesh Operational Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-6">
        {/* Return Policy / Returnable Status */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 flex items-start gap-3">
          {profile?.is_returnable ? (
            <>
              <RefreshCw className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
              <div>
                <span className="text-xs font-bold text-slate-900 dark:text-white block">
                  {locale === 'bn' ? 'রিটার্ন সুবিধা' : 'Return Policy'}
                </span>
                <span className="text-xs text-slate-600 dark:text-slate-400">
                  {dict.pdp.returnable}
                </span>
              </div>
            </>
          ) : (
            <>
              <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <span className="text-xs font-bold text-amber-700 dark:text-amber-400 block">
                  {locale === 'bn' ? 'পরিবর্তন অযোগ্য' : 'Non-Returnable'}
                </span>
                <span className="text-xs text-slate-600 dark:text-slate-400">
                  {dict.pdp.nonReturnable}
                </span>
              </div>
            </>
          )}
        </div>

        {/* Origin / Provenance */}
        {(originNote || profile?.country_of_origin) && (
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 flex items-start gap-3">
            <MapPin className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
            <div>
              <span className="text-xs font-bold text-slate-900 dark:text-white block">
                {dict.pdp.origin}
              </span>
              <span className="text-xs text-slate-600 dark:text-slate-400">
                {originNote || (locale === 'bn' ? 'বাংলাদেশ (BD)' : 'Bangladesh (BD)')}
              </span>
            </div>
          </div>
        )}

        {/* Warranty */}
        {warrantyNote && (
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 flex items-start gap-3">
            <Shield className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
            <div>
              <span className="text-xs font-bold text-slate-900 dark:text-white block">
                {dict.pdp.warranty}
              </span>
              <span className="text-xs text-slate-600 dark:text-slate-400">{warrantyNote}</span>
            </div>
          </div>
        )}

        {/* Brand */}
        {brand && (
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
            <div>
              <span className="text-xs font-bold text-slate-900 dark:text-white block">
                {dict.pdp.brand}
              </span>
              <span className="text-xs text-slate-600 dark:text-slate-400">
                {locale === 'bn' && brand.name_bn ? brand.name_bn : brand.name_en}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Care Instructions (if present) */}
      {careInstructions && (
        <div className="pt-6">
          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
            {dict.pdp.careInstructions}
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed bg-emerald-50/60 dark:bg-emerald-950/20 p-4 rounded-xl border border-emerald-100 dark:border-emerald-900/50">
            {careInstructions}
          </p>
        </div>
      )}

      {/* Category-Specific Specifications Table */}
      {attributes.length > 0 && (
        <div className="pt-6">
          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">
            {dict.pdp.specifications}
          </h3>
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <table className="w-full text-xs sm:text-sm text-left">
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {attributes.map((attr) => {
                  const label = locale === 'bn' ? attr.name_bn : attr.name_en
                  let valueDisplay = ''

                  if (attr.input_type === 'enum') {
                    valueDisplay =
                      locale === 'bn' && attr.label_bn
                        ? attr.label_bn
                        : attr.label_en || String(attr.value)
                  } else if (attr.input_type === 'boolean') {
                    valueDisplay =
                      attr.value === true
                        ? locale === 'bn'
                          ? 'হ্যাঁ (প্রযোজ্য)'
                          : 'Yes'
                        : locale === 'bn'
                        ? 'না'
                        : 'No'
                  } else if (attr.input_type === 'number') {
                    valueDisplay = `${attr.value} ${attr.unit || ''}`.trim()
                  } else {
                    valueDisplay = String(attr.value ?? '')
                  }

                  return (
                    <tr
                      key={attr.code}
                      className="even:bg-slate-50 dark:even:bg-slate-800/40 hover:bg-slate-100/50 transition-colors"
                    >
                      <th
                        scope="row"
                        className="w-2/5 px-4 py-3 font-semibold text-slate-700 dark:text-slate-300"
                      >
                        {label}
                      </th>
                      <td className="w-3/5 px-4 py-3 text-slate-600 dark:text-slate-400 font-medium">
                        {valueDisplay}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
