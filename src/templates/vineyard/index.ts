/**
 * Vineyard Template Plugin
 *
 * A calm, airy landing page: calligraphy couple names, a wide landscape banner,
 * and the place and date in script. Reuses Classic's minimal, save-the-date,
 * invitation and section layouts so every other surface stays consistent.
 */

import { vineyardMeta } from '~/templates/catalog'
import { ClassicInvitation } from '~/templates/classic/components/invitation'
import { ClassicMinimal } from '~/templates/classic/components/minimal'
import { ClassicSaveTheDate } from '~/templates/classic/components/save-the-date'
import { ClassicSections } from '~/templates/classic/components/sections'
import type { WeddingTemplate } from '~/templates/types'
import { VineyardHome } from '~/templates/vineyard/components/home'
import { vineyardTheme } from '~/templates/vineyard/theme'

export const vineyardTemplate: WeddingTemplate = {
  ...vineyardMeta,
  theme: vineyardTheme,
  components: {
    Home: VineyardHome,
    HomeMobile: VineyardHome,
    Minimal: ClassicMinimal,
    SaveTheDate: ClassicSaveTheDate,
    Invitation: ClassicInvitation,
    Sections: ClassicSections,
  },
}
