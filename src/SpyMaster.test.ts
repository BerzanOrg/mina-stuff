import assert from "node:assert"
import { describe, it } from "node:test"
import { AccountUpdate, Mina, PrivateKey, UInt64 } from "o1js"
import { SpyMasterProof, SpyMasterSmartContract, SpyMasterZkProgram } from "./SpyMaster.js"

describe("Challange 2 Tests", async () => {
    const LocalBlockchain = Mina.LocalBlockchain({ proofsEnabled: false })
    Mina.setActiveInstance(LocalBlockchain)

    const feePayer = LocalBlockchain.testAccounts[0]

    const privateKeyOfContract = PrivateKey.random()

    const spyMasterSmartContract = new SpyMasterSmartContract(privateKeyOfContract.toPublicKey())

    let earlierProof: SpyMasterProof

    it("can compile zk program and contract", async () => {
        await SpyMasterZkProgram.compile()
        await SpyMasterSmartContract.compile()
    })

    it("can deploy the contract", async () => {
        const tx = await Mina.transaction(feePayer.publicKey, () => {
            spyMasterSmartContract.deploy()
            AccountUpdate.fundNewAccount(feePayer.publicKey)
        })
        await tx.prove()
        tx.sign([feePayer.privateKey, privateKeyOfContract])
        await tx.send()

        const highestMesssageNo = spyMasterSmartContract.highestMesssageNo.get()
        assert.deepEqual(highestMesssageNo, UInt64.from(0))
    })

    it("can generate the first proof", async () => {
        earlierProof = await SpyMasterZkProgram.baseCase(UInt64.from(0))
        assert.deepEqual(earlierProof!.publicOutput, UInt64.from(0))
    })

    it("can receive valid message from agent 0", async () => {
        const messageNo = UInt64.from(1)
        const agentId = UInt64.from(0)
        const xLocation = UInt64.from(1000)
        const yLocation = UInt64.from(8000)
        const checksum = agentId.add(xLocation).add(yLocation)

        earlierProof = await SpyMasterZkProgram.receiveMessageFromAgent(
            earlierProof!.publicOutput,
            earlierProof!,
            messageNo,
            agentId,
            xLocation,
            yLocation,
            checksum,
        )
        assert.deepEqual(earlierProof!.publicOutput, UInt64.from(1))
    })

    it("can receive invalid message from agent 0 with no checks", async () => {
        const messageNo = UInt64.from(2)
        const agentId = UInt64.from(0)
        const xLocation = UInt64.from(1000)
        const yLocation = UInt64.from(8000)
        const checksum = UInt64.from(9999999999)

        earlierProof = await SpyMasterZkProgram.receiveMessageFromAgent(
            earlierProof!.publicOutput,
            earlierProof!,
            messageNo,
            agentId,
            xLocation,
            yLocation,
            checksum,
        )
        assert.deepEqual(earlierProof!.publicOutput, UInt64.from(2))
    })

    it("can receive valid message from agent 1", async () => {
        const messageNo = UInt64.from(3)
        const agentId = UInt64.from(1)
        const xLocation = UInt64.from(10000)
        const yLocation = UInt64.from(15000)
        const checksum = agentId.add(xLocation).add(yLocation)

        earlierProof = await SpyMasterZkProgram.receiveMessageFromAgent(
            earlierProof!.publicOutput,
            earlierProof!,
            messageNo,
            agentId,
            xLocation,
            yLocation,
            checksum,
        )
        assert.deepEqual(earlierProof!.publicOutput, UInt64.from(3))
    })

    it("can receive valid message from agent 2", async () => {
        const messageNo = UInt64.from(4)
        const agentId = UInt64.from(2)
        const xLocation = UInt64.from(7000)
        const yLocation = UInt64.from(18000)
        const checksum = agentId.add(xLocation).add(yLocation)

        earlierProof = await SpyMasterZkProgram.receiveMessageFromAgent(
            earlierProof!.publicOutput,
            earlierProof!,
            messageNo,
            agentId,
            xLocation,
            yLocation,
            checksum,
        )
        assert.deepEqual(earlierProof!.publicOutput, UInt64.from(4))
    })

    it("can process valid duplicate message from agent 2", async () => {
        const messageNo = UInt64.from(4)
        const agentId = UInt64.from(2)
        const xLocation = UInt64.from(7000)
        const yLocation = UInt64.from(18000)
        const checksum = agentId.add(xLocation).add(yLocation)

        earlierProof = await SpyMasterZkProgram.receiveMessageFromAgent(
            earlierProof!.publicOutput,
            earlierProof!,
            messageNo,
            agentId,
            xLocation,
            yLocation,
            checksum,
        )
        assert.deepEqual(earlierProof!.publicOutput, UInt64.from(4))
    })

    it("can process invalid duplicate message from agent 2 with no checks", async () => {
        const messageNo = UInt64.from(4)
        const agentId = UInt64.from(2)
        const xLocation = UInt64.from(7000)
        const yLocation = UInt64.from(18000)
        const checksum = UInt64.from(999999999999)

        earlierProof = await SpyMasterZkProgram.receiveMessageFromAgent(
            earlierProof!.publicOutput,
            earlierProof!,
            messageNo,
            agentId,
            xLocation,
            yLocation,
            checksum,
        )
        assert.deepEqual(earlierProof!.publicOutput, UInt64.from(4))
    })

    it("can't receive message when agent id is greater than 3000", async () => {
        const messageNo = UInt64.from(5)
        const agentId = UInt64.from(3001)
        const xLocation = UInt64.from(7000)
        const yLocation = UInt64.from(18000)
        const checksum = agentId.add(xLocation).add(yLocation)
        earlierProof = await SpyMasterZkProgram.receiveMessageFromAgent(
            earlierProof!.publicOutput,
            earlierProof!,
            messageNo,
            agentId,
            xLocation,
            yLocation,
            checksum,
        )
        assert.deepEqual(earlierProof!.publicOutput, UInt64.from(4))
    })

    it("can't receive message when x location is greater than 15000", async () => {
        const messageNo = UInt64.from(6)
        const agentId = UInt64.from(2)
        const xLocation = UInt64.from(15001)
        const yLocation = UInt64.from(18000)
        const checksum = agentId.add(xLocation).add(yLocation)
        earlierProof = await SpyMasterZkProgram.receiveMessageFromAgent(
            earlierProof!.publicOutput,
            earlierProof!,
            messageNo,
            agentId,
            xLocation,
            yLocation,
            checksum,
        )
        assert.deepEqual(earlierProof!.publicOutput, UInt64.from(4))
    })

    it("can't receive message when y location is lesser than 5000", async () => {
        const messageNo = UInt64.from(7)
        const agentId = UInt64.from(2)
        const xLocation = UInt64.from(1000)
        const yLocation = UInt64.from(4999)
        const checksum = agentId.add(xLocation).add(yLocation)
        earlierProof = await SpyMasterZkProgram.receiveMessageFromAgent(
            earlierProof!.publicOutput,
            earlierProof!,
            messageNo,
            agentId,
            xLocation,
            yLocation,
            checksum,
        )
        assert.deepEqual(earlierProof!.publicOutput, UInt64.from(4))
    })

    it("can't receive message when y location is greater than 20000", async () => {
        const messageNo = UInt64.from(8)
        const agentId = UInt64.from(2)
        const xLocation = UInt64.from(10000)
        const yLocation = UInt64.from(20001)
        const checksum = agentId.add(xLocation).add(yLocation)
        earlierProof = await SpyMasterZkProgram.receiveMessageFromAgent(
            earlierProof!.publicOutput,
            earlierProof!,
            messageNo,
            agentId,
            xLocation,
            yLocation,
            checksum,
        )
        assert.deepEqual(earlierProof!.publicOutput, UInt64.from(4))
    })

    it("can't receive message when y location is lesser than x location", async () => {
        const messageNo = UInt64.from(9)
        const agentId = UInt64.from(2)
        const xLocation = UInt64.from(12000)
        const yLocation = UInt64.from(6000)
        const checksum = agentId.add(xLocation).add(yLocation)
        earlierProof = await SpyMasterZkProgram.receiveMessageFromAgent(
            earlierProof!.publicOutput,
            earlierProof!,
            messageNo,
            agentId,
            xLocation,
            yLocation,
            checksum,
        )
        assert.deepEqual(earlierProof!.publicOutput, UInt64.from(4))
    })

    it("can update highest message number contract state", async () => {
        const tx = await Mina.transaction(feePayer.publicKey, () => {
            spyMasterSmartContract.updateHighestMessageNo(earlierProof)
        })
        await tx.prove()
        tx.sign([feePayer.privateKey])
        await tx.send()

        const highestMesssageNo = spyMasterSmartContract.highestMesssageNo.get()
        assert.deepEqual(highestMesssageNo, UInt64.from(4))
    })
})
