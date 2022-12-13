import React from 'react'

type styles = "line"|"fill"
type sizes = "fw"|"xss"|"xs"|"sm"|"1x"|"lg"|"xl"|"2x"|"3x"|"4x"|"5x"|"6x"|"7x"|"8x"|"9x"|"10x"

export default function Icon({name, style, size}: {name: string, style?: styles, size?: sizes}) {    
    return (
        <i className={`ri-${name}`+ (style ? `-${style}` : '') + (size ? ` ri-${size}`: '')}> </i>
    )
}