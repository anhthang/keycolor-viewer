import React, { useEffect, useState } from 'react';
import ReactGA from 'react-ga';
import './App.scss';

import * as fetch from 'node-fetch';
import _ from 'lodash';
import { Select, Card, Cascader, Row, Col, Form, Checkbox } from 'antd';
import { SketchPicker } from 'react-color';
import BasicLayout, { PageContainer } from '@ant-design/pro-layout';

import Footer from './components/Footer';
import Keyboard from './components/Keyboard';
import colorways from './components/colorways';

ReactGA.initialize('UA-108075000-2');
ReactGA.pageview(window.location.pathname);

const defaultCaseColor = '#e0e0e0'

const { Option } = Select

const apiUrl = process.env.PUBLIC_URL

const getName = (name) => {
  return name.split('_').map(n => n.replace(n.charAt(0), n.charAt(0).toUpperCase())).join(' ')
}

const profileMap = {
  dsa: 'dsa',
  gmk: 'cherry',
  jtk: 'cherry',
  kat: 'kat',
  sa: 'sa',
}

const keysets = []

const colorwayNames = Object.entries(colorways.list).map(([manufacturer, sets]) => {
  keysets.push(...Object.values(sets))
  return {
    value: manufacturer,
    label: manufacturer.toUpperCase(),
    children: Object.entries(sets).map(([name, c]) => {
      return {
        value: name.replaceAll('_', '-'),
        label: getName(name),
        children: c.kits ? Object.keys(c.kits).map(k => ({ value: k, label: getName(k) })) : []
      }
    })
  }
})

function App() {
  const [keyboardNames, setKeyboardNames] = useState([])
  const [keyboard, setKeyboard] = useState({})
  const [caseColor, setCaseColor] = useState(null)
  const [keymaps, setKeymaps] = useState({ layout: [] })

  const randomKeyset = _.sample(keysets)
  const [colorway, setColorway] = useState({
    key: randomKeyset,
    mod: randomKeyset
  })

  const [kit, setKit] = useState(null)
  const [changeModifier, setChangeModifier] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetch(`${apiUrl}/keyboards.json`)
      .then(res => res.json())
      .then(res => {
        const keyboards = Object.entries(res).map(([key, layout]) => {
          return {
            value: key,
            label: layout.name,
            children: layout.keyboards.map(board => ({
              value: board.keyboard_folder,
              label: board.keyboard_name,
            }))
          }
        })

        setKeyboardNames(keyboards)
      })
  }, [])

  const getLayout = (layout_name, additional) => {
    fetch(`${apiUrl}/layouts/${layout_name}.json`)
      .then(res => res.json())
      .then(res => {
        const kbLayout = {...res, ...additional}
        setKeymaps(kbLayout)
      })
  }

  const selectBoard = (keyboard_name) => {
    setLoading(true)
    fetch(`${apiUrl}/keyboards/${keyboard_name[1]}.json`)
      .then(res => res.json())
      .then(res => {
        setCaseColor((res.colors && res.colors[0].color) || defaultCaseColor)
        setKeyboard(res)

        const layout = keyboard_name[0]
        if (layout === 'default') {
          // make keyboards which still not change to new format working
          setKeymaps(res.layouts.default)
        } else {
          getLayout(layout, res.layouts[layout])
        }

        if (!keyboard || !keyboard.keyboard_name) {
          // fix bug color name has more than 2 words
          changeColorway(colorway.key.name.replace('-', '/').split('/'))
        }
        setLoading(false)
      })
      .catch(err => {
        setLoading(false)
        setKeyboard({})
      })
  }

  const changeColorway = (name, isModifier) => {
    const base = name.slice(0, 2).join('-')
    const keyset = keysets.find(c => c.name === base)
    const profileChanged = profileMap[colorway.key.name.split('-')[0]] !== profileMap[name[0]]

    setColorway({
      key: isModifier ? colorway.key : keyset,
      mod: (profileChanged || isModifier || !changeModifier) ? keyset : colorway.mod
    })

    if (!isModifier) {
      setKit(name[2])
    }
  }

  return (
    <BasicLayout
      title={process.env.REACT_APP_NAME}
      layout="top"
      logo={false}
      headerRender={false}
      footerRender={Footer}
    >
      <PageContainer className="page-container">
        <Row gutter={16}>
          <Col md={5}>
            <Card className="keyboard-box" title="Options" size="small">
              <Form layout="vertical">
                <Form.Item label="Layout & Keyboard">
                  <Cascader showSearch options={keyboardNames} onChange={selectBoard} placeholder="Select Layout & Keyboard" />
                </Form.Item>
                {
                  Array.isArray(keyboard.colors) && keyboard.colors.length && (
                    <Form.Item label="Case Color">
                      <Select
                        showSearch
                        value={caseColor}
                        defaultActiveFirstOption
                        onSelect={(e) => setCaseColor(e)}
                        placeholder="Select Case Color">
                        {
                          (keyboard.colors || []).map(c => {
                            return <Option value={c.color} key={c.color}>{c.name}</Option>
                          })
                        }
                      </Select>
                    </Form.Item>
                  )
                }
                <Form.Item label="Customize Case Color">
                  <SketchPicker
                    color={caseColor || defaultCaseColor}
                    disableAlpha={true}
                    onChange={c => setCaseColor(c.hex)}
                  />
                </Form.Item>
                <Form.Item label="Keyset">
                  <Cascader
                    showSearch
                    defaultValue={colorway.key.name.replace('-', '/').split('/')}
                    options={colorwayNames}
                    onChange={e => changeColorway(e, false)}
                    placeholder="Select Colorway"
                  />
                </Form.Item>
                <Form.Item>
                  <Checkbox
                    checked={changeModifier}
                    defaultChecked={false}
                    onChange={(e) => {
                      setChangeModifier(e.target.checked)
                      if (!e.target.checked) {
                        setColorway({
                          key: colorway.key,
                          mod: colorway.key
                        })
                      }
                    }
                  }>
                    Change Modifier Keyset
                  </Checkbox>
                </Form.Item>
                {
                  changeModifier && (
                    <Form.Item label="Modifier Keyset">
                      <Cascader
                        showSearch
                        value={colorway.mod.name.replace('-', '/').split('/')}
                        options={colorwayNames.filter(c => profileMap[c.value] === profileMap[colorway.key.name.split('-')[0]])}
                        placeholder="Select Modifier Keyset"
                        onChange={e => changeColorway(e, true)}
                      />
                    </Form.Item>
                  )
                }
              </Form>
            </Card>
          </Col>
          <Col md={19}>
            <Keyboard keyboard={keyboard} caseColor={caseColor} colorway={colorway} kit={kit} keymaps={keymaps} loading={loading} />
          </Col>
        </Row>
      </PageContainer>
    </BasicLayout>
  )
}

export default App;
