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

export function createDatabase(): PlatformDatabaseInterface {
  return {
    isValid: async () => {
      console.log('isValid')
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

      for (let i = 0; i < concepts.length; i++) {
        const concept = concepts[i]
        unigraph.addObject(
          {
            id: concept.id,
            json: JSON.stringify(concept),
          },
          jadeConceptSchemaId
        )
      }
    },
    getConcept: id => {
      console.log('getConcept', id)
      if (!unigraph.getObject) throw new Error('Cannot get object')
      /** I guess this is wrong. */
      return unigraph.getObject(id)
    },
    getAllConcepts: () => {
      return new Promise(resolve => {
        /** What should I put inside? */
        resolve(unigraph.getQueries('') as TypedConcept<unknown>[])
      })
    },
    updateConcept: concept => {
      /** The uid problem, again. */
      unigraph.updateObject(concept.id, {
        id: concept.id,
        json: JSON.stringify(concept),
      })
    },
    createConcept: concept => {
      unigraph.addObject(
        {
          id: concept.id,
          json: JSON.stringify(concept),
        },
        jadeConceptSchemaId
      )
    },
    getSettings: () => {
      return getDefaultSettings()
    },
    saveSettings: () => {
      return
    },
    /** Unused. */
    getLastUpdatedTime: () => Date.now(),
    getVersion: () => {
      return new Promise(resolve => resolve(5))
    },
    setVersion: () => {
      return
    },
    subscribeConcept: (channel, callback) => {
      if (channel === '*') return // unused, ignore it
      unigraph.subscribeToObject(channel, callback).catch(error => {
        throw error
      })
    },
    unsubscribeConcept: (channel, callback) => {
      if (channel === '*') return // unused, ignore it
      /** What is a subscription ID? */
      unigraph.unsubscribe(0)
    },
  }
}

export const database = createDatabase()

