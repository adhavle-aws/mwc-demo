# Salesforce Migration Quick Reference Card

## 🚀 Getting Started

1. Read `SALESFORCE-COMPATIBILITY-README.md` first
2. Follow `MIGRATION-STEPS.md` for timeline
3. Use `LWC-CONVERSION-EXAMPLE.md` as template
4. Reference `COMPONENT-MAPPING-REFERENCE.md` during conversion
5. Check `SLDS-STYLE-GUIDE.md` for styling

## 📋 Component Conversion Checklist

For each component:

- [ ] Create LWC folder structure
- [ ] Convert props to `@api`
- [ ] Convert state to `@track`
- [ ] Convert JSX to HTML template
- [ ] Convert event handlers
- [ ] Convert styles to SLDS
- [ ] Write Jest tests
- [ ] Deploy and test in org

## 🎨 Common Style Conversions

| Tailwind | SLDS |
|----------|------|
| `bg-gray-900` | `slds-theme_shade` |
| `text-white` | `slds-text-color_inverse` |
| `p-4` | `slds-p-around_small` |
| `rounded-lg` | `slds-border-radius_medium` |
| `flex` | `slds-grid` |
| `gap-4` | `slds-gutters` |

## 🔧 Code Pattern Conversions

### Props
```javascript
// React: interface Props { value: string }
// LWC:   @api value;
```

### State
```javascript
// React: const [count, setCount] = useState(0);
// LWC:   @track count = 0;
```

### Effects
```javascript
// React: useEffect(() => { ... }, []);
// LWC:   connectedCallback() { ... }
```

### Events
```javascript
// React: onClick={() => onSelect(id)}
// LWC:   onclick={handleClick}
//        this.dispatchEvent(new CustomEvent('select', { detail: { id } }));
```

### Computed
```javascript
// React: const name = useMemo(() => `${first} ${last}`, [first, last]);
// LWC:   get name() { return `${this.first} ${this.last}`; }
```

## 🧪 Testing Commands

```bash
# LWC unit tests
npm run test:unit

# Apex tests
sfdx force:apex:test:run -r human -c

# Deploy to sandbox
sfdx force:source:deploy -p force-app/main/default -u SandboxOrg

# Validate deployment
sfdx force:source:deploy -p force-app/main/default -u ProdOrg --checkonly
```

## ⚠️ Common Pitfalls

1. **Array mutations**: Use `this.items = [...this.items, newItem]`
2. **DOM access**: Use `renderedCallback()` not `connectedCallback()`
3. **Event bubbling**: Always set `bubbles: true, composed: true`
4. **Async in constructor**: Use `connectedCallback()` instead

## 📞 Support

- Salesforce Docs: developer.salesforce.com
- SLDS: lightningdesignsystem.com
- Internal: [Your team channel]

---

**Print this page and keep it handy during migration!**
