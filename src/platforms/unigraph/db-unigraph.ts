import { unigraph as createUnigraph } from 'unigraph-dev-common'
import { PlatformDatabaseInterface, TypedConcept } from '../../core/interfaces'
import { getDefaultSettings } from '../../core/utils/settings'

const jadeConceptSchemaId = '$/schema/jade_concept'
const jadeConceptSchema = {
  'dgraph.type': 'Type',
  _name: 'Jade Concept',
  _definition: {
    type: { 'unigraph.id': '$/composer/Object' },
    _parameters: {
      _indexedBy: { 'unigraph.id': '$/primitive/string' },
    },
    _properties: [
      {
        _key: 'json',
        _definition: {
          type: { 'unigraph.id': '$/primitive/string' },
        },
      },
      {
        _key: 'id',
        _definition: {
          type: { 'unigraph.id': '$/primitive/string' },
        },
        _unique: true,
      },
      // {
      //   _key: 'sub_concepts',
      //   _definition: {
      //     type: {
      //       'unigraph.id': '$/composer/Array',
      //     },
      //     _parameters: {
      //       _element: {
      //         type: { 'unigraph.id': jadeConceptSchemaId },
      //       },
      //     },
      //   },
      // },
    ],
  },
}

const jadeSettingsSchemaId = '$/schema/jade_settings'
const jadeSettingsSchema = {
  'dgraph.type': 'Type',
  _name: 'Jade Settings',
  _definition: {
    type: { 'unigraph.id': '$/composer/Object' },
    _parameters: {
      _indexedBy: { 'unigraph.id': '$/primitive/string' },
    },
    _properties: [
      {
        _key: 'json',
        _definition: {
          type: { 'unigraph.id': '$/primitive/string' },
        },
      },
    ],
  },
}

const jadePackage = {
  pkgManifest: {
    name: 'Jade for testing',
    package_name: 'jade.testing',
    version: '0.0.1',
    description: 'Connect Jade to Unigraph',
  },
  pkgSchemas: {
    jade_concept: jadeConceptSchema,
    jade_settings: jadeSettingsSchema,
  },
}

const host = window.location.hostname
const userSettings = {
  serverLocation: `ws://${host}:3001`,
  browserId: 'test',
}

console.log(userSettings)

const unigraph = createUnigraph(
  userSettings.serverLocation,
  userSettings.browserId
)

interface DryConcept {
  id: string
  json: string
}

function hydrateConcept(
  dryConcept: DryConcept
): TypedConcept<unknown> | undefined {
  try {
    const concept = JSON.parse(dryConcept.json) as TypedConcept<unknown>
    return concept.relations ? concept : { ...concept, relations: [] }
  } catch (error) {
    console.log(error)
    return undefined
  }
}

function panicNotImplemented(...args: unknown[]) {
  console.log('[not implemented]', ...args)
}

export function createDatabase(): PlatformDatabaseInterface {
  return {
    isValid: async () => {
      panicNotImplemented('isValid')
      return false // let it init() on every load
      const jadePackageName = jadePackage.pkgManifest.package_name
      const packages = await unigraph.getPackages([jadePackageName])
      return !!packages[jadePackageName]
    },
    init: async (settings, concepts) => {
      console.log('init')
      if (!unigraph.addPackage) throw new Error('Cannot add package')
      await unigraph.addPackage(jadePackage)

      unigraph.addObject(
        { json: JSON.stringify(settings) },
        jadeSettingsSchemaId
      )

      unigraph.addObject(
        concepts.map(c => ({
          id: c.id,
          json: JSON.stringify(c),
        })),
        jadeConceptSchemaId
      )
    },
    getConcept: async id => {
      console.log('getConcept', id)
      const dryConcepts = (await unigraph.getQueries([
        `
(func: uid(jadeConceptUids)) @cascade {
  uid
  _value {
    id @filter(eq(<_value.%>, "${id}"))
    json { <_value.%> }
  }
}
var (func: eq(<unigraph.id>, "$/schema/jade_concept")) {
  <~type> {
    jadeConceptUids as uid
  }
}`,
      ])) as [
        {
          uid: string
          _value: {
            json: { '_value.%': string }
          }
        }[]
      ]
      const dryConcept = {
        id,
        json: dryConcepts[0][0]._value.json['_value.%'],
      }
      console.log(dryConcepts)
      const concept = hydrateConcept(dryConcept)
      return concept
    },
    getAllConcepts: () => {
      panicNotImplemented('getAllConcepts')
      return new Promise(resolve => {
        resolve([])
      })
    },
    updateConcept: concept => {
      panicNotImplemented('updateConcept')
      /** How to get uid? Query it with concept id first? */
      // unigraph.updateObject(concept.id, {
      //   id: concept.id,
      //   json: JSON.stringify(concept),
      // })
      /** Can I just add it? Seems to be yes. */
      unigraph.addObject(
        {
          id: concept.id,
          json: JSON.stringify(concept),
        },
        jadeConceptSchemaId
      )
    },
    createConcept: concept => {
      console.log('createConcept')
      unigraph.addObject(
        {
          id: concept.id,
          json: JSON.stringify(concept),
        },
        jadeConceptSchemaId
      )
    },
    getSettings: () => {
      panicNotImplemented('getSettings')
      return getDefaultSettings()
    },
    saveSettings: () => {
      panicNotImplemented('saveSettings')
      return
    },
    /** Unused. */
    getLastUpdatedTime: () => Date.now(),
    getVersion: () => {
      panicNotImplemented('getVersion')
      return new Promise(resolve => resolve(5))
    },
    setVersion: () => {
      return
    },
    subscribeConcept: (channel, callback) => {
      panicNotImplemented('subscribeConcept')
      if (channel === '*') return // unused, ignore it
      // unigraph
      //   .subscribeToObject(channel, result => {
      //     callback(convertToConcept(result))
      //   })
      //   .catch(error => {
      //     throw error
      //   })
    },
    unsubscribeConcept: (channel, callback) => {
      panicNotImplemented('unSubscribeConcept')
      if (channel === '*') return // unused, ignore it
      /** What is a subscription ID? */
      unigraph.unsubscribe(0)
    },
  }
}

export const database = createDatabase()

