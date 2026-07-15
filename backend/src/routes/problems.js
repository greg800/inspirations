import { createStoryItemRouter } from '../lib/storyItems.js'
import { stepByKey } from '../lib/steps.js'

export default createStoryItemRouter(stepByKey('problems'))
